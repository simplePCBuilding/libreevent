/* 
*
*   LANGUAGE SCHOOL HOSSEGOR - Booking system
*               mailManager.js
*
*       Developed 2022 by Janis Hutz
*
*/
// import and init of nodemailer middleware
const mailer = require( 'nodemailer' );
const html2text = require( 'html-to-text' );

const db = require( '../db/db.js' );

let transporter = mailer.createTransport( db.getJSONDataSync( __starterDir + '/config/mail.config.json' ) );


class MailManager {
    constructor () {
        this.options = {
            wordwrap: 130
        };
    }

    /* 
      This method sends a mail with recipient, html, subject and sender as arguments
    */
    sendMail ( recipient, html, subject, sender ) {
        let text = html2text.convert( html, this.options );
        let mailOptions = {
            from: sender,
            to: recipient,
            subject: subject,
            html: html,
            text: text,
        };

        transporter.sendMail( mailOptions, function ( error ) {
            if ( error ) {
                console.error( error );
            }
        } );
    }

    sendMailWithAttachment ( recipient, html, subject, attachments, from ) {
        // Attachments have to be an array of objects that have filename and path as their keys
        let text = html2text.convert( html, this.options );
        let mailOptions = {
            from: from,
            to: recipient,
            subject: subject,
            html: html,
            text: text,
            attachments: attachments
        };

        transporter.sendMail( mailOptions, function ( error ) {
            if ( error ) {
                console.error( error );
            }
        } );
    }
}

module.exports = MailManager;