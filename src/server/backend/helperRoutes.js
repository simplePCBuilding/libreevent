const path = require( 'path' );

module.exports = ( app, settings ) => {
    app.get( '/eventAssets/:image', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/../assets/events/' + req.params.image ) );
    } );

    app.get( '/otherAssets/:image', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/../assets/' + req.params.image ) );
    } );

    app.get( '/supportFiles/:file', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/../ui/home/templates/' + settings.startPage + '/supportFiles/' + req.params.file ) );
    } );

    // TODO: Decide if removed or not
    app.get( '/startPage/helperFunction', ( req, res ) => {
        res.sendFile( path.join( __dirname + '/../ui/home/helper.js' ) );
    } );
};