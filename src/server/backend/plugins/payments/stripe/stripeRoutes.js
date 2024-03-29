/*
*				libreevent - stripeRoutes.js
*
*	Created by Janis Hutz 07/25/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const fs = require( 'fs' );
const path = require( 'path' );
const db = require( '../../../db/db.js' );
// TODO: update config files to non-secret version for final version
const stripeConfig = JSON.parse( fs.readFileSync( path.join( __dirname + '/config.payments.json' ) ) );
const stripe = require( 'stripe' )( stripeConfig[ 'APIKey' ] );
const bodyParser = require( 'body-parser' );
const ticket = require( '../../../tickets/ticketGenerator.js' );
const TicketGenerator = new ticket();
const generator = require( '../../../token.js' );

const endpointSecret = stripeConfig[ 'endpointSecret' ];

let sessionReference = {};
let waitingClients = {};
let pendingPayments = {};
let paymentOk = {};

module.exports = ( app, settings ) => {
    app.post( '/payments/prepare', bodyParser.json(), ( req, res ) => {
        if ( req.session.loggedInUser ) {
            db.getDataSimple( 'users', 'email', req.session.username ).then( user => {
                if ( user[ 0 ] ) {
                    if ( user[ 0 ][ 'mail_confirmed' ] ) {
                        let purchase = {
                            'line_items': [],
                            'mode': 'payment',
                            'success_url': settings.yourDomain + '/payments/success',
                            'cancel_url': settings.yourDomain + '/payments/canceled',
                            'submit_type': 'book',
                            'customer_email': req.session.username
                        };

                        // Get cart and prepare order
                        db.getDataSimple( 'temp', 'user_id', req.session.id ).then( dat => {
                            if ( dat[ 0 ] ) {
                                db.getJSONData( 'events' ).then( events => {
                                    let data = JSON.parse( dat[ 0 ].data );
                                    ( async () => {
                                        for ( let event in data ) {
                                            for ( let item in data[ event ] ) {
                                                purchase[ 'line_items' ].push( {
                                                    'price_data': {
                                                        'product_data': {
                                                            'name': data[ event ][ item ].name,
                                                        },
                                                        'currency': settings.currency,
                                                        'unit_amount': Math.round( parseFloat( events[ event ][ 'categories' ][ data[ event ][ item ].category ].price[ data[ event ][ item ][ 'ticketOption' ] ] ) * 100 ),
                                                    },
                                                    'quantity': data[ event ][ item ].count ?? 1,
                                                } );
                                            }
                                        }
                                        const session = await stripe.checkout.sessions.create( purchase );
                                        sessionReference[ session.id ] = { 'tok': req.session.id, 'email': req.session.username };
                                        pendingPayments[ req.session.id ] = true;
                                        db.writeDataSimple( 'processingOrders', 'user_id', req.session.id, dat[ 0 ] ).then( () => {
                                            res.send( session.url );
                                        } );
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

    app.post( '/payments/webhook', bodyParser.raw( { type: 'application/json' } ), async ( req, res ) => {
        const payload = req.body;
        const sig = req.headers[ 'stripe-signature' ];
        
        let event;

        try {
            event = stripe.webhooks.constructEvent( payload, sig, endpointSecret );
        } catch ( err ) {
            console.error( err );
            return res.status( 400 ).send( 'Webhook Error' );
        }

        res.status( 200 ).end();
        if ( event.type === 'checkout.session.completed' ) {
            setTimeout( () => {
                if ( waitingClients[ sessionReference[ event.data.object.id ][ 'tok' ] ] ) {
                    waitingClients[ sessionReference[ event.data.object.id ][ 'tok' ] ].write( 'data: paymentOk\n\n' );
                }
            }, 1000 );
            db.getDataSimple( 'processingOrders', 'user_id', sessionReference[ event.data.object.id ][ 'tok' ] ).then( dat => {
                db.getDataSimple( 'users', 'email', sessionReference[ event.data.object.id ][ 'email' ] ).then( user => {
                    if ( user[ 0 ] && dat[ 0 ] ) {
                        const tickets = JSON.parse( dat[ 0 ].data );
                        db.writeDataSimple( 'orders', 'account_id', user[ 0 ].account_id, { 'account_id': user[ 0 ].account_id, 'tickets': dat[ 0 ].data, 'order_name': sessionReference[ event.data.object.id ][ 'tok' ] } ).then( () => {
                            TicketGenerator.generateTickets( sessionReference[ event.data.object.id ] );
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
                                    db.deleteDataSimple( 'temp', 'user_id', sessionReference[ event.data.object.id ][ 'tok' ] ).then( () => {
                                        db.deleteDataSimple( 'processingOrders', 'user_id', sessionReference[ event.data.object.id ][ 'tok' ] ).then( () => {
                                            delete pendingPayments[ sessionReference[ event.data.object.id ][ 'tok' ] ];
                                        } ).catch( error => {
                                            console.error( '[ STRIPE ] ERROR whilst deleting data from DB: ' + error );
                                        } );
                                    } ).catch( error => {
                                        console.error( '[ STRIPE ] ERROR whilst deleting data from DB: ' + error );
                                    } );
                                } ).catch( error => {
                                    console.error( '[ STRIPE ] ERROR whilst getting data from DB: ' + error );
                                } );
                            } );
                        } );
                    } else {
                        TicketGenerator.sendErrorMail( sessionReference[ event.data.object.id ][ 'tok' ], sessionReference[ event.data.object.id ][ 'email' ] );
                    }
                } );
            } ).catch( err => {
                console.error( err );
            } );
        }
    } );
};