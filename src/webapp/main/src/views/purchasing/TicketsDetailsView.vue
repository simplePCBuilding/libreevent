<!--
*				libreevent - TicketsDetailsView.vue
*
*	Created by Janis Hutz 05/14/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
-->

<template>
    <div class="details">
        <div class="top-container">
            <h1>{{ event.name }}</h1>
            <router-link to="/tickets"><span class="material-symbols-outlined" style="font-size: 100%;">arrow_back</span>Back</router-link>
            <p>{{ event.description }}</p>
            <router-link to="/tickets/order">Order tickets</router-link>
        </div>
    </div>
</template>

<style scoped>
    .details {
        height: 100%;
    }
    
    .top-container {
        background: linear-gradient( to top, rgba( 0, 0, 0, 0.9 ) 50%, rgba( 0, 0, 0, 0 ) ), url( '@/assets/logo.png');
        background-repeat: no-repeat;
        background-size: cover;
        height: 100%;
    }
</style>

<script>
    export default {
        name: 'TicketsDetailsView',
        created () {
            if ( !sessionStorage.getItem( 'selectedTicket' ) ) {
                this.$router.push( '/tickets' );
            }
            this.eventID = sessionStorage.getItem( 'selectedTicket' );
        },
        data() {
            return {
                event: { 'name': 'TestEvent', 'description': 'This is a description for the TestEvent to test multiline support and proper positioning of the Fields', 'freeSeats': 2, 'maxSeats': 2, 'date':'TestDate', 'startingPrice':15, 'location': 'TestLocation', 'eventID': 'test', 'currency': 'CHF', 'logo': 'logo.png' },
            }
        }
    };
</script>
