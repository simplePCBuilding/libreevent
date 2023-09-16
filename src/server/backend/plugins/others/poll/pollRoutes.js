/*
*				libreevent - pollRoutes.js
*
*	Created by Janis Hutz 08/13/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const path = require( 'path' );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );

module.exports = ( app ) => {
    app.get( '/polls/:vote', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/html/voting.html' ) );
    } );

    app.get( '/polls/css/:file', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/css/' + req.params.file ) );
    } );

    app.get( '/polls/js/:file', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/js/' + req.params.file ) );
    } );
    
    app.get( '/polls/getDetails/:vote', ( req, res ) => {
        fs.readFile( path.join( __dirname + '/data/votingSettings.json' ), ( error, filedata ) => {
            res.send( JSON.parse( filedata )[ req.params.vote ] ?? {} );
        } );
    } );
    
    app.get( '/polls/get/:vote', ( req, res ) => {
        fs.readFile( path.join( __dirname + '/data/voting.json' ), ( error, filedata ) => {
            res.send( JSON.parse( filedata )[ req.params.vote ] ?? {} );
        } );
    } );
    
    app.post( '/polls/vote/:vote/', bodyParser.json(), ( req, res ) => {
        // up / down-voting
        fs.readFile( path.join( __dirname + '/data/voting.json' ), ( error, filedata ) => {
            let json = JSON.parse( filedata );
            if ( json[ req.params.vote ] ) {
                if ( req.body.voteType === 'up' ) {
                    json[ req.params.vote ][ req.body.id ].count += 1;
                } else if ( req.body.voteType === 'down' ) {
                    json[ req.params.vote ][ req.body.id ].count -= 1;
                }
                fs.writeFile( path.join( __dirname + '/data/voting.json' ), JSON.stringify( json ), ( err ) => {
                    if ( err ) res.status( 500 ).send( 'ERR_VOTING' );
                    res.send( 'ok' );
                } );
            } else {
                res.status( 404 ).send( 'ok' );
            }
        } );
    } );
    
    app.post( '/polls/add/:vote', bodyParser.json(), ( req, res ) => {
        let data = req.body;
        if ( data.title && data.comment ) {
            fs.readFile( path.join( __dirname + '/data/voting.json' ), ( error, filedata ) => {
                let file = JSON.parse( filedata );
                if ( !file[ req.params.vote ] ) {
                    file[ req.params.vote ] = {};
                }
                const id = parseInt( Object.keys( file[ req.params.vote ] )[ Object.keys( file[ req.params.vote ] ).length - 1 ] ?? 0 ) + 1;
                file[ req.params.vote ][ id ] = data;
                file[ req.params.vote ][ id ][ 'id' ] = id;
                file[ req.params.vote ][ id ][ 'count' ] = 1;
                fs.writeFile( path.join( __dirname + '/data/voting.json' ), JSON.stringify( file ), ( error ) => {
                    if ( error ) console.error( 'failed to write data', file );
                    res.send( 'ok' );
                } );
            } );
        } else {
            res.status( 400 ).send( 'incomplete' );
        }
    } );

    app.get( '/admin/plugins/polls', ( req, res ) => {
        if ( req.session.loggedInAdmin ) {
            res.sendFile( path.join( __dirname + '/html/settings.html' ) );
        } else {
            res.status( 403 ).send( 'unauthorized' );
        }
    } );

    app.get( '/admin/plugins/polls/getData', ( req, res ) => {
        if ( req.session.loggedInAdmin ) {
            res.sendFile( path.join( __dirname + '/data/votingSettings.json' ) );
        } else {
            res.status( 403 ).send( 'unauthorized' );
        }
    } );

    app.post( '/admin/plugins/polls/save', bodyParser.json(), ( req, res ) => {
        if ( req.session.loggedInAdmin ) {
            fs.writeFileSync( path.join( __dirname + '/data/votingSettings.json' ), JSON.stringify( req.body ) );
            res.send( 'ok' );
        } else {
            res.status( 403 ).send( 'unauthorized' );
        }
    } );
};