/*
*				libreevent - postHandler.js
*
*	Created by Janis Hutz 07/20/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const db = require( '../../backend/db/db.js' );
const pwdmanager = require( '../pwdmanager.js' );
const pm = require( '../../backend/plugins/manager.js' );
const spm = require( '../startPageManager.js' );
const startPageManager = new spm();



class POSTHandler {
    constructor ( settings ) {
        this.pluginManager = new pm( settings );
        this.settings = settings;
    }

    handleCall ( call, data, lang ) {
        return new Promise( ( resolve, reject ) => {
            console.log( lang );
            if ( call === 'saveSeatplanDraft' ) {
                db.getJSONDataSimple( 'seatplan', data.location ).then( res => {
                    let dat = res;
                    dat[ 'draft' ] = data.data;
                    db.writeJSONDataSimple( 'seatplan', data.location, dat ).then( resp => { 
                        db.getJSONDataSimple( 'locations', data.location ).then( dat => { 
                            let s = dat;
                            s[ 'totalSeats' ] = data.data.seatInfo.count;
                            db.writeJSONDataSimple( 'locations', data.location, s ).then( () => {
                                resolve( resp );
                            } );
                        } );
                    } ).catch( error => {
                        reject( { 'code': 500, 'error': error } );
                    } );
                } );
            } else if ( call === 'saveSeatplan' ) {
                db.writeJSONDataSimple( 'seatplan', data.location, { 'draft': {}, 'save': data.data } ).then( resp => { 
                    db.getJSONDataSimple( 'locations', data.location ).then( dat => { 
                        let s = dat;
                        s[ 'totalSeats' ] = data.data.seatInfo.count;
                        db.writeJSONDataSimple( 'locations', data.location, s ).then( () => {
                            resolve( resp );
                        } );
                    } );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'saveLocations' ) {
                db.getJSONData( 'seatplan' ).then( res => {
                    let dat = res;
                    for ( let loc in data.updated ) {
                        if ( res[ loc ] ) {
                            dat[ data.updated[ loc ] ] = res[ loc ];
                            delete dat[ loc ];
                        }
                    }
                    db.writeJSONData( 'seatplan', dat ).catch( error => {
                        reject( { 'code': 500, 'error': error } );
                    } );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );

                db.writeJSONData( 'locations', data.data ).then( resp => { 
                    resolve( resp );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'deleteLocation' ) {
                db.deleteJSONDataSimple( 'locations', data.location ).then( () => {
                    resolve( 'ok' );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'createEvent' ) {
                db.getJSONDataSimple( 'eventDrafts', data.event ).then( dat => {
                    if ( Object.keys( dat ).length < 1 ) {
                        db.writeJSONDataSimple( 'eventDrafts', data.event, { 'name': 'Unnamed event', 'description': '', 'location': '', 'date': '', 'categories': {}, 'ageGroups': { '1': { 'id': 1, 'name': 'Child', 'age': '0 - 15.99' }, '2': { 'id': 2, 'name': 'Adult' } }, 'maxTickets': 2, 'eventID': data.event } ).then( () => {
                            resolve( 'ok' );
                        } ).catch( error => {
                            reject( { 'code': 500, 'error': error } );
                        } );
                    } else {
                        reject( { 'code': 409, 'error': 'ExistsAlready' } );
                    }
                } );
            } else if ( call === 'saveEvent' ) {
                db.writeJSONDataSimple( 'eventDrafts', data.event, data.eventData ).then( () => {
                    resolve( 'ok' );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'deployEvent' ) {
                db.writeJSONDataSimple( 'events', data.event, data.eventData ).then( () => {
                    resolve( 'ok' );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'deleteEvent' ) {
                db.deleteJSONDataSimple( 'eventDrafts', data.event ).then( () => {
                    db.deleteJSONDataSimple( 'events', data.event ).then( () => {
                        resolve( 'ok' );
                    } ).catch( error => {
                        reject( { 'code': 500, 'error': error } );
                    } );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'undeployEvent' ) {
                db.deleteJSONDataSimple( 'events', data.event ).then( () => {
                    resolve( 'ok' );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'saveTickets' ) {
                db.writeJSONDataSimple( 'tickets', data.location, data.data ).then( resp => { 
                    resolve( resp );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'createAdminAccount' ) {
                let dat = data;
                pwdmanager.hashPassword( dat.pass ).then( hash => {
                    dat[ 'pass' ] = hash;
                    db.writeDataSimple( 'admin', 'email', data.email, dat ).then( resp => {
                        resolve( resp );
                    } ).catch( error => {
                        reject( { 'code': 500, 'error': error } );
                    } );
                } );
            } else if ( call === 'updateAdminAccount' ) {
                if ( data.pass ) {
                    let dat = data;
                    pwdmanager.hashPassword( data.pass ).then( hash => {
                        dat[ 'pass' ] = hash;
                        db.writeDataSimple( 'admin', 'email', data.email, dat ).then( resp => {
                            resolve( resp );
                        } ).catch( error => {
                            reject( { 'code': 500, 'error': error } );
                        } );
                    } );
                } else {
                    db.writeDataSimple( 'admin', 'email', data.email, data ).then( resp => {
                        resolve( resp );
                    } ).catch( error => {
                        reject( { 'code': 500, 'error': error } );
                    } );
                }
            } else if ( call === 'deleteAdminAccount' ) {
                db.deleteDataSimple( 'admin', 'email', data.email ).then( resp => {
                    resolve( resp );
                } ).catch( error => {
                    reject( { 'code': 500, 'error': error } );
                } );
            } else if ( call === 'updateSettings' ) {
                this.settings[ 'twoFA' ] = data.twoFA;
                this.settings[ 'currency' ] = data.currency;
                this.settings[ 'payments' ] = data.payments;
                this.settings[ 'ticketTimeout' ] = data.ticketTimeout;
                db.saveSettings( this.settings );
                db.getJSONData( 'events' ).then( dat => {
                    let updated = dat;
                    for ( let event in updated ) {
                        updated[ event ][ 'currency' ] = data.currency;
                    }
                    db.writeJSONData( 'events', updated );
                } );
                resolve( 'ok' );
            } else if ( call === 'updatePaymentGatewaySettings' ) {
                this.pluginManager.savePaymentGatewaySettings( data ).then( () => {
                    resolve( 'ok' );
                } ).catch( err => {
                    reject( { 'code': 500, 'message': err } );
                } );
            } else if ( call === 'savePageSettings' ) {
                startPageManager.saveStartPagePreferences( data.page, data.preferences );
                resolve( 'ok' );
            } else {
                reject( { 'code': 404, 'error': 'Route not found' } );
            }
        } );
    }
}

module.exports = POSTHandler;