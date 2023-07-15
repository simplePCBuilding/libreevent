/*
*				libreevent - app.js
*
*	Created by Janis Hutz 02/26/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

const express = require( 'express' );
let app = express();
const path = require( 'path' );
const expressSession = require( 'express-session' );
const bodyParser = require( 'body-parser' );
const cookieParser = require( 'cookie-parser' );
const http = require( 'http' );
const fs = require( 'fs' );

const settings = JSON.parse( fs.readFileSync( path.join( __dirname + '/config/settings.config.json' ) ) );

// const mail = require( './backend/mail/mailSender.js' );
// const mailManager = new mail();

// const dbh = require( './backend/db/mysqldb.js' );
// const db = new dbh();

// db.connect();

// const env = process.env.PROD || false;


// if ( !settings.init ) {
//     db.setupDB( 'janishut_libreeventTest' );
// }

// const responseTime = require( 'response-time' );
// app.use( responseTime( ( request, response, time ) => {
//     console.log( time );
// } ) );

app.use( express.static( '../webapp/dist' ) );
// app.use( express.static( '.' ) );

// initialise express with middlewares
// TODO: Generate random token
app.use( expressSession( {
    secret: 'gaoevgoawefgo083tq2rfvöfaf0p8',
    resave: true,
    saveUninitialized: true,
    cookie: {
        sameSite: 'none'
    }
} ) );

app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );
app.use( cookieParser() );

require( './admin/routes.js' )( app, settings ); // admin routes
require( './backend/userRoutes.js' )( app, settings ); // user routes

app.use( ( request, response ) => {
    response.sendFile( path.join( __dirname + '/../webapp/dist/index.html' ) );
} );

const PORT = process.env.PORT || 8081;
console.log( 'Server listening on Port ' + PORT );
http.createServer( app ).listen( PORT );