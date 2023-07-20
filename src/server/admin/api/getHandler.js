/*
*				libreevent - getHandler.js
*
*	Created by Janis Hutz 07/20/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const db = require( '../../backend/db/db.js' );

class GETHandler {
    constructor () {

    }

    handleCall ( call, query ) {
        return new Promise( ( resolve, reject ) => {
            if ( call === 'getSeatplan' ) {
                db.getJSONDataSimple( 'seatplan', query.location ).then( data => {
                    if ( Object.keys( data ).length > 0 ) {
                        resolve( data[ 'save' ] );
                    } else {
                        reject( 'No data found for this location' );
                    }
                } ).catch( error => {
                    reject( error );
                } );
            } else if ( call === 'getSeatplanDraft' ) {
                db.getJSONDataSimple( 'seatplan', query.location ).then( data => {
                    if ( Object.keys( data ).length > 0 ) {
                        if ( Object.keys( data[ 'draft' ] ).length > 0 ) {
                            resolve( data[ 'draft' ] );
                        } else {
                            resolve( data[ 'save' ] );
                        }
                    } else {
                        reject( 'No data found for this location' );
                    }
                } ).catch( error => {
                    reject( error );
                } );
            }
        } );
    }
}

module.exports = GETHandler;