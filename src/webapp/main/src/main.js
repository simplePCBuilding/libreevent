/*
*				libreevent - main.js
*
*	Created by Janis Hutz 05/12/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { useUserStore } from '@/stores/userStore';

let app = createApp( App );

app.use( createPinia() );

let userStore = useUserStore();

let prod = true;

if ( prod ) {
    fetch( '/api/getAuth' ).then( res => {
        // fetch( 'http://localhost:8081/api/getAuth' ).then( res => {
        res.json().then( data => {
            userStore.setUserAuth( data.user );
            userStore.setAdminAuth( data.admin );
            localStorage.setItem( 'url', '' );
            fetch( '/getAPI/getName' ).then( res => {
                res.json().then( data => {
                    userStore.setPageName( data.name );
                    app.use( router );
                    app.mount( '#app' );
                } );
            } );
        } );
    } );
} else {
    localStorage.setItem( 'url', 'http://localhost:8080' );
    userStore.setUserAuth( true );
    userStore.setAdminAuth( true );
    localStorage.setItem( 'name', 'libreevent' );
    app.use( router );
    app.mount( '#app' );
}
