/*
*				libreevent - payrexxRoutes.js
*
*	Created by Janis Hutz 08/12/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const db = require( '../../../db/db.js' );
const bodyParser = require( 'body-parser' );
const ticket = require( '../../../tickets/ticketGenerator.js' );
const payrexxModule = require( './module.payrexx.js' );
const payrexx = payrexxModule.init();
const TicketGenerator = new ticket();
const generator = require( '../../../token.js' );

let sessionReference = {};
let waitingClients = {};
let pendingPayments = {};
let gatewayReference = {};
let paymentOk = {};

module.exports = ( app, settings ) => {
    app.post( '/payments/prepare', bodyParser.json(), ( req, res ) => {
        if ( req.session.loggedInUser ) {
            db.getDataSimple( 'users', 'email', req.session.username ).then( user => {
                if ( user[ 0 ] ) {
                    if ( user[ 0 ][ 'mail_confirmed' ] ) {
                        let purchase = {
                            'successRedirectUrl': settings.yourDomain + '/payments/success',
                            'cancelRedirectUrl': settings.yourDomain + '/payments/canceled',
                            'failedRedirectUrl': settings.yourDomain + '/payments/failed',
                            'currency': settings.currency,
                            'basket': [],
                            'amount': 0,
                            'referenceId': req.session.id,
                        };

                        db.getDataSimple( 'temp', 'user_id', req.session.id ).then( dat => {
                            if ( dat[ 0 ] ) {
                                db.getJSONData( 'events' ).then( events => {
                                    let data = JSON.parse( dat[ 0 ].data );
                                    ( async () => {
                                        for ( let event in data ) {
                                            for ( let item in data[ event ] ) {
                                                purchase[ 'basket' ].push( {
                                                    'name': data[ event ][ item ].name,
                                                    'quantity': data[ event ][ item ].count ?? 1,
                                                    'amount': Math.round( parseFloat( events[ event ][ 'categories' ][ data[ event ][ item ].category ].price[ data[ event ][ item ][ 'ticketOption' ] ] ) * 100 ),
                                                } );
                                                purchase[ 'amount' ] += Math.round( parseFloat( events[ event ][ 'categories' ][ data[ event ][ item ].category ].price[ data[ event ][ item ][ 'ticketOption' ] ] ) * 100 ) * ( data[ event ][ item ].count ?? 1 );
                                            }
                                        }
                                        const response = await payrexx.createGateway( purchase );
                                        if ( response.status === 200 ) {
                                            const session = response.data.data[ 0 ];
                                            sessionReference[ session.id ] = { 'tok': req.session.id, 'email': req.session.username };
                                            pendingPayments[ req.session.id ] = true;
                                            gatewayReference[ req.session.id ] = session.id;
                                            db.writeDataSimple( 'processingOrders', 'user_id', req.session.id, dat[ 0 ] ).then( () => {
                                                res.send( session.link );
                                            } );
                                        } else {
                                            res.status( 500 ).send( 'ERR_PAYMENT' );
                                        }
                                    } )();
                                } );
                            } else {
                                res.status( 400 ).send( 'ERR_UID_NOT_FOUND' );
                            }
                        } ).catch( error => {
                            console.error( '[ STRIPE ] DB ERROR: ' + error );
                            res.status( 500 ).send( 'ERR_DB' );
                        } );
                    } else {
                        res.status( 428 ).send( 'ERR_MAIL_UNCONFIRMED' );
                    }
                } else {
                    res.status( 428 ).send( 'ERR_MAIL_UNCONFIRMED' );
                }
            } );
        } else {
            res.status( 403 ).send( 'ERR_UNAUTHORIZED' );
        }
    } );

    app.get( '/payments/status', ( request, response ) => {
        response.writeHead( 200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        } );
        response.status( 200 );
        response.flushHeaders();
        response.write( 'data: connected\n\n' );
        waitingClients[ request.session.id ] = response;
        const ping = setInterval( () => {
            if ( !pendingPayments[ request.session.id ] ) {
                const stat = TicketGenerator.getGenerationStatus( request.session.id );
                if ( stat === 'done' ) {
                    clearInterval( ping );
                    setTimeout( () => {
                        response.write( 'data: ready\n\n' );
                        delete waitingClients[ request.session.id ];
                        request.session.lastOrderID = request.session.id;
                        request.session.id = generator.generateToken( 30 );
                        response.end();
                    }, 2000 );
                } else if ( stat === 'noTicket' ) {
                    clearInterval( ping );
                    response.write( 'data: noData\n\n' );
                    response.end();
                    delete waitingClients[ request.session.id ];
                }
            }
        }, 2000 );
    } );

    app.get( '/user/2fa/ping', ( request, response ) => {
        if ( paymentOk[ request.session.id ] === 'ok' ) {
            delete paymentOk[ request.session.id ];
            response.send( { 'status': 'paymentOk' } );
        } else { 
            if ( !pendingPayments[ request.session.id ] ) {
                const stat = TicketGenerator.getGenerationStatus( request.session.id );
                if ( stat === 'done' ) {
                    request.session.lastOrderID = request.session.id;
                    request.session.id = generator.generateToken( 30 );
                    response.send( { 'status': 'ticketOk' } );
                } else if ( stat === 'noTicket' ) {
                    response.send( { 'status': 'noTicket' } );
                } else {
                    response.send( '' );
                }
            } else {
                response.send( '' );
            }
        }
    } );

    app.post( '/payments/webhook', bodyParser.json(), async ( req, res ) => {
        if ( !req.body ) {
            if ( !req.body.transaction ) {
                res.status( 400 ).send( 'ERR_REQ_WRONG' );
                return;
            }
        }
        if ( req.body.transaction.status === 'confirmed' ) {
            const response = await payrexx.getGateway( gatewayReference[ req.body.transaction.referenceId ] );

            if ( response.status === 200 ) {
                const gateway = response.data.data[ 0 ];
            
                res.status( 200 ).end();
                if ( gateway.status === 'confirmed' ) {
                    setTimeout( () => {
                        if ( waitingClients[ sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] ] ) {
                            waitingClients[ sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] ].write( 'data: paymentOk\n\n' );
                        }
                    }, 1000 );
                    db.getDataSimple( 'processingOrders', 'user_id', sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] ).then( dat => {
                        db.getDataSimple( 'users', 'email', sessionReference[ response.data.data[ 0 ].id ][ 'email' ] ).then( user => {
                            if ( user[ 0 ] && dat[ 0 ] ) {
                                const tickets = JSON.parse( dat[ 0 ].data );
                                db.writeDataSimple( 'orders', 'account_id', user[ 0 ].account_id, { 'account_id': user[ 0 ].account_id, 'tickets': dat[ 0 ].data, 'order_name': sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] } ).then( () => {
                                    console.log( sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] );
                                    TicketGenerator.generateTickets( sessionReference[ response.data.data[ 0 ].id ] );
                                    db.getJSONData( 'booked' ).then( ret => {
                                        let booked = ret ?? {};
                                        for ( let event in tickets ) {
                                            if ( !booked[ String( event ) ] ) {
                                                booked[ String( event ) ] = {};
                                            }
                                            for ( let tik in tickets[ event ] ) {
                                                booked[ event ][ tik ] = tickets[ event ][ tik ];
                                            }
                                        }
                                        db.writeJSONData( 'booked', booked ).then( () => {
                                            db.deleteDataSimple( 'temp', 'user_id', sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] ).then( () => {
                                                db.deleteDataSimple( 'processingOrders', 'user_id', sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] ).then( () => {
                                                    delete pendingPayments[ sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] ];
                                                } ).catch( error => {
                                                    console.error( '[ PAYREXX ] ERROR whilst deleting data from DB: ' + error );
                                                } );
                                            } ).catch( error => {
                                                console.error( '[ PAYREXX ] ERROR whilst deleting data from DB: ' + error );
                                            } );
                                        } );
                                        db.deleteDataSimple( 'temp', 'user_id', sessionReference[ response.data.data[ 0 ].id ][ 'tok' ] ).catch( error => {
                                            console.error( '[ PAYREXX ] ERROR whilst deleting data from DB: ' + error );
                                        } );
                                    } );
                                } );
                            } else {
                                TicketGenerator.sendErrorMail( sessionReference[ response.data.data[ 0 ].id ][ 'tok' ], sessionReference[ response.data.data[ 0 ].id ][ 'email' ] );
                            }
                        } );
                    } ).catch( err => {
                        console.error( err );
                    } );
                }
            } else {
                res.send( 'ok' );
            }
        } else {
            res.send( 'ok' );
        }
    } );
};