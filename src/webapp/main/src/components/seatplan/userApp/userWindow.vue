<!--
*				libreevent - window.vue
*
*	Created by Janis Hutz 05/12/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
-->

<template>
    <div id="window">
        <h2>Seat plan: {{ event.name }}</h2>
        <div class="parent" id="parent" @wheel="( e ) => { handleScroll( e ); }" @mousemove="( e ) => { handleDrag( e ); }" @mousedown="( e ) => { setOffset( e ); }">
            <div class="content-parent">
                <Vue3DraggableResizable v-for="draggable in draggables" :initW="draggable.w" :initH="draggable.h" :x="draggable.x" :y="draggable.y" :w="draggable.w" :h="draggable.h"
                    :active="false" :draggable="false" :resizable="false" :parent="true" class="draggable-box">

                    <circularSeatplanComponent v-if="draggable.shape == 'circular' && draggable.type == 'seat'" :ref="'component' + draggable.id" 
                    :scale-factor="scaleFactor" :w="draggable.w" :h="draggable.h" :origin="draggable.origin" :starting-row="draggable.startingRow" 
                    :data="draggable.data" :id="draggable.id"
                    @seatSelected="( seat ) => { seatSelected( seat ) }" @seatDeselected="( seat ) => { seatDeselected( seat ) }"></circularSeatplanComponent>

                    <trapezoidSeatplanComponent v-else-if="draggable.shape == 'trapezoid' && draggable.type == 'seat'" :ref="'component' + draggable.id" 
                    :scale-factor="scaleFactor" :w="draggable.w" :h="draggable.h" :origin="draggable.origin" :starting-row="draggable.startingRow" 
                    :data="draggable.data" :id="draggable.id"
                    @seatSelected="( seat ) => { seatSelected( seat ) }" @seatDeselected="( seat ) => { seatDeselected( seat ) }"></trapezoidSeatplanComponent>

                    <rectangularSeatplanComponent v-else-if="draggable.shape == 'rectangular' && draggable.type == 'seat'" :ref="'component' + draggable.id" 
                    :scale-factor="scaleFactor" :w="draggable.w" :h="draggable.h" :origin="draggable.origin" :starting-row="draggable.startingRow" 
                    :data="draggable.data" :id="draggable.id" 
                    @seatSelected="( seat ) => { seatSelected( seat ) }" @seatDeselected="( seat ) => { seatDeselected( seat ) }"></rectangularSeatplanComponent>

                    <stagesSeatplanComponent :ref="'component' + draggable.id" v-else-if="draggable.type == 'stage'" :origin="draggable.origin" :shape="draggable.shape"></stagesSeatplanComponent>
                    <standingSeatplanComponent :ref="'component' + draggable.id" v-else-if="draggable.type == 'stand'" :origin="draggable.origin" :shape="draggable.shape"></standingSeatplanComponent>
                    <textFieldSeatplanComponent :ref="'component' + draggable.id" v-else-if="draggable.type == 'text'" :text="draggable.text.text" :text-size="draggable.text.textSize" :colour="draggable.text.colour" :origin="draggable.origin" :scale-factor="scaleFactor"></textFieldSeatplanComponent>
                </Vue3DraggableResizable>
            </div>
        </div>
        <div class="toolbar">
            <button title="Zoom in [+]" @click="zoom( 0.2 )"><span class="material-symbols-outlined">zoom_in</span></button>
            <button title="Reset zoom [=]" @click="zoom( 1 );"><span class="material-symbols-outlined">center_focus_strong</span></button>
            <button title="Zoom out [-]" @click="zoom( -0.2 )"><span class="material-symbols-outlined">zoom_out</span></button>
        </div>
        <sideCartView :cart="cart" ref="cart"></sideCartView>
        <notifications ref="notification" location="topleft"></notifications>
        <popups ref="popups" size="normal" @data="data => { reserveTicket( data ) }"></popups>
    </div>
</template>

<script>
    import Vue3DraggableResizable from 'vue3-draggable-resizable';
    import circularSeatplanComponent from '@/components/seatplan/userApp/seatplanComponents/seats/circular.vue';
    import rectangularSeatplanComponent from '@/components/seatplan/userApp/seatplanComponents/seats/rectangular.vue';
    import trapezoidSeatplanComponent from '@/components/seatplan/userApp/seatplanComponents/seats/trapezoid.vue';
    import stagesSeatplanComponent from '@/components/seatplan/userApp/seatplanComponents/stages.vue';
    import standingSeatplanComponent from '@/components/seatplan/userApp/seatplanComponents/standing.vue';
    import textFieldSeatplanComponent from '@/components/seatplan/userApp/seatplanComponents/textField.vue';
    import notifications from '@/components/notifications/notifications.vue';
    import popups from '@/components/notifications/popups.vue';
    import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css';
    import sideCartView from '@/components/sideCartView.vue';

    export default {
        'name': 'window',
        components: { 
            Vue3DraggableResizable,
            circularSeatplanComponent,
            rectangularSeatplanComponent,
            trapezoidSeatplanComponent,
            stagesSeatplanComponent,
            standingSeatplanComponent,
            textFieldSeatplanComponent,
            notifications,
            popups,
            sideCartView,
        },
        data() {
            return {
                draggables: { 1: { 'x': 100, 'y':100, 'h': 100, 'w': 250, 'active': false, 'draggable': true, 'resizable': true, 'id': 1, 'origin': 1, 'shape':'rectangular', 'type': 'seat', 'startingRow': 1, 'seatCountingStartingPoint': 1, 'sector': 'A', 'text': { 'text': 'TestText', 'textSize': 20, 'colour': '#20FFFF' }, 'ticketCount': 1, 'category': 1 } },
                event: { 'name': 'TestEvent2', 'location': 'TestLocation2', 'date': '2023-07-15', 'RoomName': 'TestRoom2', 'currency': 'CHF', 'categories': { '1': { 'price': { '1':25, '2':35 }, 'bg': 'black', 'fg': 'white', 'name': 'Category 1' }, '2': { 'price': { '1':15, '2':20 }, 'bg': 'green', 'fg': 'white', 'name': 'Category 2' } }, 'ageGroups': { '1':{ 'id': 1, 'name':'Child', 'age':'0 - 15.99' }, '2':{ 'id': 2, 'name': 'Adult' } }, 'ageGroupCount': 2, 'maxTickets': 2 },
                available: { 'redo': false, 'undo': false },
                scaleFactor: 1,
                sizePoll: null,
                prevSize: { 'h': window.innerHeight, 'w': window.innerWidth },
                zoomFactor: 1,
                standardDeviation: { 'currentTop': 0, 'currentLeft': 0 },
                movePos: { 'top': 0, 'left': 0, 'isMoving': false, 'isSet': false },
                generalSettings: { 'namingScheme': 'numeric' },
                selectedSeat: {},
                cart: {},
            }
        },
        methods: {
            /* 
                Coords are from top left corner of box.
                The below function is executed as the init hook (created hook)
                of vue.js, so whenever this particular page is loaded.
                It loads seat plan data and starts the event listeners
                for keyevents (like +, -, =)
            */
            runHook () {
                let self = this;
                this.zoomFactor = sessionStorage.getItem( 'zoom' ) ? parseFloat( sessionStorage.getItem( 'zoom' ) ) : 1;


                document.onkeydown = function ( event ) {
                    if ( event.key === '+' ) {
                        self.zoom( 0.2 );
                    } else if ( event.key === '-' ) {
                        self.zoom( -0.2 );
                    } else  if ( event.key === '=' ) {
                        self.zoom( 1 );
                    }
                };

                // Load cart
                this.cart = localStorage.getItem( 'cart' ) ? JSON.parse( localStorage.getItem( 'cart' ) ): {};
                

                // Load seatplan from server
                let height = $( document ).height() * 0.8;
                this.scaleFactor = ( height / 900 ) * this.zoomFactor;
                fetch( localStorage.getItem( 'url' ) + '/getAPI/getSeatplan?location=' + sessionStorage.getItem( 'selectedTicket' ) ).then( res => { 
                    if ( res.status === 200 ) {
                        res.json().then( data => {
                            this.draggables = this.scaleUp( data.data );
                            sessionStorage.setItem( 'seatplan', JSON.stringify( data.data ) );
                        } );
                    } else if ( res.status === 500 ) {
                        if ( sessionStorage.getItem( 'seatplan' ) ) {
                            this.draggables = this.scaleUp( JSON.parse( sessionStorage.getItem( 'seatplan' ) ) );
                        }
                    }
                } );

                // TODO: remove scaleDown function again once backend is up
                // TODO: Optimise for odd screen sizes and aspect ratios and fucking webkit
                sessionStorage.setItem( 'seatplan', JSON.stringify( this.scaleDown( this.draggables ) ) );
            },
            eventHandler ( e ) {
                if ( this.prevSize.h != window.innerHeight || this.prevSize.w != window.innerWidth ) {
                    this.prevSize = { 'h': window.innerHeight, 'w': window.innerWidth };
                    this.loadSeatplan();
                }
            },
            handleScroll ( e ) {
                e.preventDefault();
                if ( e.deltaY > 0 ) {
                    this.zoom( 0.2 );
                } else {
                    this.zoom( -0.2 );
                }
            },
            setOffset( e ) {
                this.standardDeviation.currentLeft = e.clientX;
                this.standardDeviation.currentTop = e.clientY;
            },
            handleDrag ( e ) {
                if ( e.buttons === 1 ) {
                    let parent = document.getElementById( 'parent' );
                    if ( !this.movePos.isSet ) {
                        this.movePos.left = parent.scrollWidth - parent.scrollLeft;
                        this.movePos.top = parent.scrollHeight - parent.scrollTop;
                        this.movePos.isSet = true;
                    }
                    this.movePos.isMoving = true;
                    e.preventDefault();
                    let valueTop = parent.scrollHeight - ( e.clientY - this.standardDeviation.currentTop + this.movePos.top );
                    let valueLeft = parent.scrollWidth - ( e.clientX - this.standardDeviation.currentLeft + this.movePos.left );
                    parent.scrollTop = valueTop > 0 ? valueTop : 0;
                    parent.scrollLeft = valueLeft > 0 ? valueLeft : 0;
                } else {
                    if ( this.movePos.isMoving ) {
                        let parent = document.getElementById( 'parent' );
                        this.movePos.left = parent.scrollWidth - parent.scrollLeft;
                        this.movePos.top = parent.scrollHeight - parent.scrollTop;
                        this.movePos.isMoving = false;
                    }
                };
            },
            scaleDown ( valueArray ) {
                const allowedAttributes = [ 'w', 'h', 'x', 'y' ]
                let returnArray = {};
                for ( let entry in valueArray ) {
                    returnArray[ entry ] = {};
                    for ( let attributes in valueArray[ entry ] ) {
                        if ( allowedAttributes.includes( attributes ) ) {
                            returnArray[ entry ][ attributes ] = Math.round( ( valueArray[ entry ][ attributes ] / this.scaleFactor ) * 1000 ) / 1000;
                        } else {
                            returnArray[ entry ][ attributes ] = valueArray[ entry ][ attributes ];
                        }
                    }
                }
                return returnArray;
            },
            loadSeatplan () {
                /* 
                    Calculate scale factor (this adds support for differently sized screens)
                    900px is the "default" height
                */

                let height = $( document ).height() * 0.8;
                this.scaleFactor = ( height / 900 ) * this.zoomFactor;
                /* 
                    Load seatplan
                */
                if ( sessionStorage.getItem( 'seatplan' ) ) {
                    this.draggables = this.scaleUp( JSON.parse( sessionStorage.getItem( 'seatplan' ) ) );
                }

                // TODO: Check if all seats are available
                let allSeatsAvailable = true;
                // Method: Server sends all user selected seats + all selected seats. If seat is in both
                // then selected, if just in all selected, taken, else available.

                let self = this;
                if ( !allSeatsAvailable ) {
                    setTimeout( () => {
                        self.$refs.popups.openPopup( 'We are sorry to tell you that since the last time the seat plan was refreshed, one or more of the seats you have selected has/have been taken.', {}, 'string' );
                    }, 500 );
                }

                // Mark all selected seats + all unavailable seats
                // { 'sector': 'A', 'sectorCount': 1, 'unavailableSeats': { 'secAr0s0': 'nav' }, 'categoryInfo': { 'pricing': { '1': { 'displayName': 'Adults - CHF 20.-', 'value': 'adult', 'price': 20 }, '2': { 'displayName': 'Child (0 - 15.99y) - CHF 15.-', 'value': 'child', 'price': 15 } } } }
                let categoryDetails = {};
                for ( let category in this.event.categories ) {
                    categoryDetails[ category ] = {};
                    for ( let group in this.event.ageGroups ) {
                        categoryDetails[ category ][ group ] = {};
                        categoryDetails[ category ][ group ] = { 'displayName': this.event.ageGroups[ group ].name + ( this.event.ageGroups[ group ].age ? ' (' + this.event.ageGroups[ group ].age + ')' : '' ) + ' - ' + this.event.currency + ' ' + this.event.categories[ category ].price[ group ], 'value': group, 'price': this.event.categories[ category ].price[ group ] };
                    }
                }

                for ( let element in this.draggables ) {
                    this.draggables[ element ][ 'data' ] = { 'sector': this.draggables[ element ][ 'sector' ], 'unavailableSeats': {}, 'categoryInfo': { 'pricing': categoryDetails[ this.draggables[ element ][ 'category' ] ] } };
                }

                if ( this.cart[ this.event.name ] ) {
                    let tickets = this.cart[ this.event.name ][ 'tickets' ];
                    for ( let ticket in tickets ) {
                        this.draggables[ tickets[ ticket ].comp ][ 'data' ][ 'unavailableSeats' ][ ticket ] = 'sel';
                    }
                }
            },
            scaleUp ( valueArray ) {
                const allowedAttributes = [ 'w', 'h', 'x', 'y' ];
                let returnArray = {};
                for ( let entry in valueArray ) {
                    returnArray[ entry ] = {};
                    for ( let attributes in valueArray[ entry ] ) {
                        if ( allowedAttributes.includes( attributes ) ) {
                            returnArray[ entry ][ attributes ] = Math.round( ( valueArray[ entry ][ attributes ] * this.scaleFactor ) * 1000 ) / 1000;
                        } else {
                            returnArray[ entry ][ attributes ] = valueArray[ entry ][ attributes ];
                        }
                    }
                }
                return returnArray;
            },
            zoom ( scale ) {
                if ( scale == 1 ) {
                    this.zoomFactor = 1;
                    sessionStorage.setItem( 'zoom', this.zoomFactor );
                    this.loadSeatplan();
                } else {
                    if ( ( this.zoomFactor < 0.3 && scale < 0 ) || ( this.zoomFactor > 2.9 && scale > 0 ) ) {
                        
                    } else {
                        this.zoomFactor += scale;
                    }
                    sessionStorage.setItem( 'zoom', this.zoomFactor );
                    this.loadSeatplan();
                }
            },
            seatSelected ( seat ) {
                this.selectedSeat = seat;
                console.log( seat );
                if ( Object.keys( seat.option ).length > 1 ) {
                    this.$refs.popups.openPopup( 'Please choose a ticket option', seat.option, 'selection', 'adult' );
                } else {
                    this.reserveTicket( { 'status': 'ok', 'data': Object.keys( seat.option )[ 0 ][ 'value' ], 'id': this.selectedSeat.componentID } );
                }
            },
            cartHandling ( operation, data ) {
                if ( operation === 'select' ) {
                    console.log( this.selectedSeat.option );
                    if ( this.cart[ this.event.name ] ) {
                        this.cart[ this.event.name ][ 'tickets' ][ this.selectedSeat.id ] = { 'displayName': this.selectedSeat.displayName, 'price': this.selectedSeat.option[ data ].price, 'id': this.selectedSeat.id, 'option': data, 'comp': this.selectedSeat.componentID };
                    } else {
                        this.cart[ this.event.name ] = { 'displayName': this.event.name, 'tickets': {} };
                        this.cart[ this.event.name ][ 'tickets' ][ this.selectedSeat.id ] = { 'displayName': this.selectedSeat.displayName, 'price': this.selectedSeat.option[ data ].price, 'id': this.selectedSeat.id, 'option': data, 'comp': this.selectedSeat.componentID };
                    }
                } else if ( operation === 'deselect' ) {
                    if ( Object.keys( this.cart[ this.event.name ][ 'tickets' ] ).length > 1 ) {
                        delete this.cart[ this.event.name ][ 'tickets' ][ this.selectedSeat.id ];
                    } else {
                        delete this.cart[ this.event.name ];
                    }
                }
                this.$refs.cart.calculateTotal();
                localStorage.setItem( 'cart', JSON.stringify( this.cart ) );
            },
            reserveTicket ( option ) {
                console.log( this.selectedSeat.componentID );
                if ( option.status == 'ok' ) {
                    this.$refs[ 'component' + this.selectedSeat.componentID ][ 0 ].validateSeatSelection( this.selectedSeat, option.data );
                    this.cartHandling( 'select', option.data );
                }
                // TODO: Make call to server to reserve ticket when data is returned & save to localStorage array.
            },
            seatDeselected ( seat ) {
                this.selectedSeat = seat;
                this.cartHandling( 'deselect' );
                // TODO: Make call to server to deselect ticket & delete from localStorage array and delete eventArray if empty!
            }
        },
        created () {
            this.runHook();
            this.sizePoll = setInterval( this.eventHandler, 250 );
        },
        unmounted() {
            clearInterval( this.sizePoll );
        },
    }
</script>

<style scoped>
    .parent {
        height: 80vh;
        aspect-ratio: 16 / 9;
        -webkit-aspect-ratio: 16 / 9;
        top: 17vh;
        left: 5vw;
        position: absolute;
        border: black 1px solid;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        overflow: scroll;
    }

    .draggable-box {
        cursor: default;
    }

    .properties {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        z-index: 1;
        background-color: var( --accent-background );
        color: var( --secondary-color );
        width: 20vw;
        height: 90vh;
        top: 7.5vh;
        right: 0.5vw;
        overflow: scroll;
    }

    .content-parent {
        aspect-ratio: 16 / 9;
        height: 400%;
    }

    .toolbar {
        display: flex;
        position: fixed;
        top: 17vh;
        left: 5.5vw;
    }
    .toolbar button {
        margin-top: 10%;
        cursor: pointer;
    }

    .toolbar button:disabled {
        cursor: default;
    }
</style>