/*
*				libreevent - db.js
*
*	Created by Janis Hutz 03/26/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const path = require( 'path' );
const fs = require( 'fs' );

const settings = JSON.parse( fs.readFileSync( path.join( __dirname + '/../../config/settings.config.json' ) ) );

const dbRef = { 'user': 'libreevent_users', 'admin': 'libreevent_admin', 'order': 'libreevent_orders', 'users': 'libreevent_users', 'orders': 'libreevent_orders', 'temp': 'libreevent_temp' };

let dbh;

if ( settings.db === 'mysql' ) {
    const dbsoft = require( './mysqldb.js' );
    dbh = new dbsoft();
    dbh.connect();
} else {
    const dbsoft = require( './jsondb.js' );
    dbh = new dbsoft();
    dbh.connect();
}

module.exports.getDataSimple = ( db, column, searchQuery ) => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( { 'command': 'getFilteredData', 'property': column, 'searchQuery': searchQuery }, dbRef[ db ] ).then( data => {
            resolve( data );
        } ).catch( error => {
            reject( error );
        } );
    } );
};

module.exports.getData = ( db ) => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( { 'command': 'getAllData' }, dbRef[ db ] ).then( data => {
            resolve( data );
        } ).catch( error => {
            reject( error );
        } );
    } );
};

module.exports.writeDataSimple = ( db, column, searchQuery, data ) => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( { 'command': 'checkDataAvailability', 'property': column, 'searchQuery': searchQuery }, dbRef[ db ] ).then( res => {
            if ( res.length > 0 ) {
                dbh.query( { 'command': 'updateData', 'property': column, 'searchQuery': searchQuery, 'newValues': data }, dbRef[ db ] ).then( dat => {
                    resolve( dat );
                } ).catch( error => {
                    reject( error );
                } );
            } else {
                dbh.query( { 'command': 'addData', 'data': data }, dbRef[ db ] ).then( dat => {
                    resolve( dat );
                } ).catch( error => {
                    reject( error );
                } );
            }
        } ).catch( error => {
            reject( error );
        } );
    } );
};

module.exports.deleteDataSimple = ( db, column, searchQuery ) => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( { 'command': 'deleteData', 'property': column, 'searchQuery': searchQuery }, dbRef[ db ] ).then( dat => {
            resolve( dat );
        } ).catch( error => {
            reject( error );
        } );
    } );
};

module.exports.checkDataAvailability = ( db, column, searchQuery ) => {
    return new Promise( ( resolve, reject ) => {
        dbh.query( { 'command': 'checkDataAvailability', 'property': column, 'searchQuery': searchQuery }, dbRef[ db ] ).then( res => {
            if ( res.length > 0 ) {
                resolve( true );
            } else {
                resolve( false );
            }
        } ).catch( error => {
            reject( error );
        } );
    } );
};


module.exports.getJSONData = ( file ) => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/data/' + file + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                if ( data.byteLength > 0 ) {
                    resolve( JSON.parse( data ) ?? {} );
                } else {
                    resolve( { } );
                }
            }
        } );
    } );
};

module.exports.getJSONDataSimple = ( file, identifier ) => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/data/' + file + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                if ( data.byteLength > 0 ) {
                    resolve( JSON.parse( data )[ identifier ] ?? {} );
                } else {
                    resolve( { } );
                }
            }
        } );
    } );
};

module.exports.getJSONDataSync = ( file ) => {
    return JSON.parse( fs.readFileSync( path.join( __dirname + '/../../' + file ) ) );
};

module.exports.writeJSONDataSimple = ( db, identifier, values ) => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/data/' + db + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                let dat = {};
                if ( data.byteLength > 0 ) {
                    dat = JSON.parse( data ) ?? {};
                }
                dat[ identifier ] = values;
                fs.writeFile( path.join( __dirname + '/data/' + db + '.json' ), JSON.stringify( dat ), ( error ) => {
                    if ( error ) {
                        reject( 'Error occurred: Error trace: ' + error );
                    }
                    resolve( true );
                } );
            }
        } );
    } );
};

module.exports.writeJSONData = ( db, data ) => {
    return new Promise( ( resolve, reject ) => {
        fs.writeFile( path.join( __dirname + '/data/' + db + '.json' ), JSON.stringify( data ), ( error ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                resolve( true );
            }
        } );
    } );
};

module.exports.deleteJSONDataSimple = ( db, identifier ) => {
    return new Promise( ( resolve, reject ) => {
        fs.readFile( path.join( __dirname + '/data/' + db + '.json' ), ( error, data ) => {
            if ( error ) {
                reject( 'Error occurred: Error trace: ' + error );
            } else {
                let dat = {};
                if ( data.byteLength > 0 ) {
                    dat = JSON.parse( data ) ?? {};
                }
                delete dat[ identifier ];
                fs.writeFile( path.join( __dirname + '/data/' + db + '.json' ), JSON.stringify( dat ), ( error ) => {
                    if ( error ) {
                        reject( 'Error occurred: Error trace: ' + error );
                    }
                    resolve( true );
                } );
            }
        } );
    } );
};

// TODO: Build garbage collector for DB (parse DB every so often (get from settings) 
// and delete all items where timestamp is older than a certain amount of time (get from settings))