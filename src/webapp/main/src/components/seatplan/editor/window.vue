<!-- eslint-disable no-undef -->
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
        <properties class="properties" v-model:draggables="draggables" @updated="handleUpdate" :scale-factor="scaleFactor" :active="active" :history-pos="historyPos" :zoom-factor="zoomFactor" v-model:general-settings="generalSettings"></properties>
        <div class="parent" id="parent">
            <div class="content-parent">
                <Vue3DraggableResizable v-for="draggable in draggables" :initW="draggable.w" :initH="draggable.h" v-model:x="draggable.x" v-model:y="draggable.y" v-model:w="draggable.w" v-model:h="draggable.h"
                    v-model:active="draggable.active" v-model:draggable="draggable.draggable" :resizable="draggable.resizable" :parent="true" @activated="activateComponent( draggable.id );"
                    @drag-end="saveHistory();" @resize-end="saveHistory();" @contextmenu="( e ) => { e.preventDefault(); }" class="draggable-box">
                    <circularSeatplanComponent v-if="draggable.shape == 'circular' && draggable.type == 'seat'" :scale-factor="scaleFactor" 
                    :w="draggable.w" :h="draggable.h" :origin="draggable.origin" :starting-row="draggable.startingRow" :id="draggable.id" @seatingInfo="( info ) => { handleSeatCountInfo( info ); }"></circularSeatplanComponent>
                    <trapezoidSeatplanComponent v-else-if="draggable.shape == 'trapezoid' && draggable.type == 'seat'" :scale-factor="scaleFactor" 
                    :w="draggable.w" :h="draggable.h" :origin="draggable.origin" :starting-row="draggable.startingRow" :id="draggable.id" @seatingInfo="( info ) => { handleSeatCountInfo( info ); }"></trapezoidSeatplanComponent>
                    <rectangularSeatplanComponent v-else-if="draggable.shape == 'rectangular' && draggable.type == 'seat'" :scale-factor="scaleFactor" 
                    :w="draggable.w" :h="draggable.h" :origin="draggable.origin" :id="draggable.id" @seatingInfo="( info ) => { handleSeatCountInfo( info ); }"></rectangularSeatplanComponent>
                    <stagesSeatplanComponent v-else-if="draggable.type == 'stage'" :origin="draggable.origin" :shape="draggable.shape"></stagesSeatplanComponent>
                    <standingSeatplanComponent v-else-if="draggable.type == 'stand'" :origin="draggable.origin" :shape="draggable.shape"></standingSeatplanComponent>
                    <textFieldSeatplanComponent v-else-if="draggable.type == 'text'" :text="draggable.text.text" :text-size="draggable.text.textSize" 
                    :colour="draggable.text.colour" :origin="draggable.origin" :scale-factor="scaleFactor"></textFieldSeatplanComponent>
                </Vue3DraggableResizable>
            </div>
        </div>
        <div class="toolbar">
            <button title="Go back to location settings" @click="this.$router.push( '/admin/locations' )"><span class="material-symbols-outlined">arrow_back</span></button>
            <button title="Undo [Ctrl + Z]" v-if="available.undo" @click="historyOp( 'undo' )"><span class="material-symbols-outlined">undo</span></button>
            <button title="Undo (unavailable)" v-else disabled><span class="material-symbols-outlined">undo</span></button>
            <button title="Redo [Ctrl + Y]" v-if="available.redo" @click="historyOp( 'redo' )"><span class="material-symbols-outlined">redo</span></button>
            <button title="Redo (unavailable)" v-else disabled><span class="material-symbols-outlined">redo</span></button>
            <button title="Zoom in [+]" @click="zoom( 0.2 )"><span class="material-symbols-outlined">zoom_in</span></button>
            <button title="Reset zoom [=]" @click="zoom( 1 );"><span class="material-symbols-outlined">center_focus_strong</span></button>
            <button title="Zoom out [-]" @click="zoom( -0.2 )"><span class="material-symbols-outlined">zoom_out</span></button>
            <button title="Add component [Ctrl + I]" @click="addNewElement()"><span class="material-symbols-outlined">add</span></button>
            <button title="Remove selected component [Delete]" @click="deleteSelected()"><span class="material-symbols-outlined">delete</span></button>
            <button title="Save this seatplan as a draft [Ctrl + S]" @click="saveDraft()"><span class="material-symbols-outlined">save</span></button>
            <button title="Deploy this seatplan (save it for use)" @click="deploy()"><span class="material-symbols-outlined">system_update_alt</span></button>
        </div>
        <notifications ref="notification" location="topleft"></notifications>
    </div>
</template>

<script>
import Vue3DraggableResizable from 'vue3-draggable-resizable';
import properties from '@/components/seatplan/editor/properties.vue';
import circularSeatplanComponent from '@/components/seatplan/seatplanComponents/seats/circular.vue';
import rectangularSeatplanComponent from '@/components/seatplan/seatplanComponents/seats/rectangular.vue';
import trapezoidSeatplanComponent from '@/components/seatplan/seatplanComponents/seats/trapezoid.vue';
import stagesSeatplanComponent from '@/components/seatplan/seatplanComponents/stages.vue';
import standingSeatplanComponent from '@/components/seatplan/seatplanComponents/standing.vue';
import textFieldSeatplanComponent from '@/components/seatplan/seatplanComponents/textField.vue';
import notifications from '@/components/notifications/notifications.vue';
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css';

export default {
    'name': 'window',
    components: { 
        Vue3DraggableResizable,
        properties,
        circularSeatplanComponent,
        rectangularSeatplanComponent,
        trapezoidSeatplanComponent,
        stagesSeatplanComponent,
        standingSeatplanComponent,
        textFieldSeatplanComponent,
        notifications,
    },
    data() {
        return {
            active: 0,
            draggables: { 1: { 'x': 100, 'y': 100, 'h': 100, 'w': 250, 'active': false, 'draggable': true, 'resizable': true, 'id': 1, 'origin': 1, 'shape': 'rectangular', 'type': 'seat', 'startingRow': 1, 'sector': 'A', 'text': { 'text': 'TestText', 'textSize': 20, 'colour': '#20FFFF' }, 'numberingDirection': 'left', 'seatNumberingPosition': 1, 'category': '1' } },
            available: { 'redo': false, 'undo': false },
            scaleFactor: 1,
            sizePoll: null,
            prevSize: { 'h': window.innerHeight, 'w': window.innerWidth },
            zoomFactor: 1,
            historyPos: 0,
            generalSettings: { 'namingScheme': 'numeric' },
            seatCountInfo: { 'details': {}, 'count': 0 },
            autoSave: null,
        };
    },
    methods: {
        /* 
                Coords are from top left corner of box.
                The below function is executed as the init hook (created hook)
                of vue.js, so whenever this particular page is loaded.
                It loads previous data (if available) and starts the event listeners
                for keyevents (like delete) and also check if the user uses a desktop
                browser that meets all the requirements for being able to use the editor
                reliably according to testing done.
            */
        runHook () {
            if ( !sessionStorage.getItem( 'locationID' ) ) {
                this.$router.push( '/admin/events' );
            }
            let self = this;
            this.zoomFactor = sessionStorage.getItem( 'zoom' ) ? parseFloat( sessionStorage.getItem( 'zoom' ) ) : 1;

            /* 
                    Keybinds:
                        - Delete: delete selected object
                        - Ctrl + S: Save
                        - Ctrl + Z: Undo
                        - Ctrl + Y: Redo
                */
            document.onkeydown = function ( event ) {
                if ( event.key === 'Delete' ) {
                    event.preventDefault();
                    self.deleteSelected();
                } else if ( event.ctrlKey && event.key === 's' ) {
                    event.preventDefault();
                    self.saveDraft();
                } else if ( ( event.ctrlKey && event.key === 'y' ) ) {
                    event.preventDefault();
                    self.historyOp( 'redo' );
                } else if ( event.ctrlKey && event.key === 'z' ) {
                    event.preventDefault();
                    self.historyOp( 'undo' );
                } else if ( event.ctrlKey && event.key === 'i' ) {
                    event.preventDefault();
                    self.addNewElement();
                } else if ( event.key === '+' ) {
                    self.zoom( 0.2 );
                } else if ( event.key === '-' ) {
                    self.zoom( -0.2 );
                } else  if ( event.key === '=' ) {
                    self.zoom( 1 );
                }
            };

            // Auto save every 60s (60K ms)
            this.autoSave = setInterval( () => {
                const options = {
                    method: 'post',
                    body: JSON.stringify( { 'data': { 'seatInfo': this.seatCountInfo, 'data': this.scaleDown( this.draggables ) }, 'location': sessionStorage.getItem( 'locationID' ) } ),
                    headers: {
                        'Content-Type': 'application/json',
                        'charset': 'utf-8'
                    }
                };
                fetch( localStorage.getItem( 'url' ) + '/admin/api/saveSeatplanDraft', options );
            }, 60000 );
                
            /* 
                Calculate scale factor (this adds support for differently sized screens)
                900px is the "default" height
                */
               
            let height = $( document ).height() * 0.8;
            this.scaleFactor = ( height / 900 ) * this.zoomFactor;
                
            /* 
                    Load seatplan
                */
            fetch( localStorage.getItem( 'url' ) + '/admin/getAPI/getSeatplanDraft?location=' + sessionStorage.getItem( 'locationID' ) ).then( res => { 
                if ( res.status === 200 ) {
                    res.json().then( data => {
                        this.draggables = this.scaleUp( data.data );
                        sessionStorage.setItem( 'seatplan', JSON.stringify( data.data ) );
                        for ( let element in this.draggables ) {
                            if ( this.draggables[ element ].active ) {
                                this.draggables[ element ].active = false;
                            }
                        }
                    } );
                } else if ( res.status === 500 ) {
                    if ( sessionStorage.getItem( 'seatplan' ) ) {
                        this.draggables = this.scaleUp( JSON.parse( sessionStorage.getItem( 'seatplan' ) ) );
                    }
                    for ( let element in this.draggables ) {
                        if ( this.draggables[ element ].active ) {
                            this.draggables[ element ].active = false;
                        }
                    }
                }
            } );

            if ( !sessionStorage.getItem( 'seatplan-history' ) ) {
                sessionStorage.setItem( 'seatplan-history', JSON.stringify( { '1': this.scaleDown( this.draggables ) } ) );
            }

            let history = sessionStorage.getItem( 'seatplan-history' ) ? JSON.parse( sessionStorage.getItem( 'seatplan-history' ) ) : {};
            let count = parseInt( Object.keys( history ).length );

            if ( count > parseInt( sessionStorage.getItem( 'historyPos' ) ) ) {
                this.available.redo = true;
            }

            if ( parseInt( sessionStorage.getItem( 'historyPos' ) ) > 0 ) {
                this.available.undo = true;
            }

            // if ( window.webpage.engine.trident ) {
            //     alert( 'Welcome! We have detected that you are still using Internet Explorer or a similar browser. As a modern webapp, libreevent does NOT officially support Internet Explorer. If you run into problems whilst using this webapp, please switch to a modern browser like Firefox.' );
            // } else if ( window.webpage.engine.presto ) {
            //     alert( 'Welcome! We have detected that you are a very old version of Opera or related browser. As a modern webapp, libreevent does only support modern browsers. If you run into issues whilst using this webapp, please switch to a modern browser, like Firefox.' );
            // } else if ( window.webpage.engine.webkit ) {
            //     alert( 'Hello! Whilst tested with some versions of Webkit (the browser engine of Safari), support for this engine is still unofficial. Therefore we cannot guarantee that all the features of the seatplan editor function as they should. If you run into problems, please contact us through the link provided in the documentation.' );
            // }
            this.save();
        },
        eventHandler () {
            if ( this.prevSize.h != window.innerHeight || this.prevSize.w != window.innerWidth ) {
                this.prevSize = { 'h': window.innerHeight, 'w': window.innerWidth };
                this.loadSeatplan();
            }
        },
        loadSeatplan () {
            /* 
                    Calculate scale factor (this adds support for differently sized screens)
                    900px is the "default" height
                */

            let height = $( document ).height() * 0.8;
            this.scaleFactor = ( height / 900 ) * this.zoomFactor;

            if ( sessionStorage.getItem( 'seatplan' ) ) {
                this.draggables = this.scaleUp( JSON.parse( sessionStorage.getItem( 'seatplan' ) ) );
            }


            for ( let element in this.draggables ) {
                if ( this.draggables[ element ].active ) {
                    this.draggables[ element ].active = false;
                }
            }
        },
        scaleDown ( valueArray ) {
            const allowedAttributes = [ 'w', 'h', 'x', 'y' ];
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
        activateComponent ( id ) {
            this.active = id;
        },
        saveHistory () {
            let history = sessionStorage.getItem( 'seatplan-history' ) ? JSON.parse( sessionStorage.getItem( 'seatplan-history' ) ) : {};
            let count = parseInt( Object.keys( history ).length + 1 );
            this.historyPos = count;
            if ( count - 1 > parseInt( sessionStorage.getItem( 'historyPos' ) ) ) {
                for ( let i = parseInt( sessionStorage.getItem( 'historyPos' ) ) + 1; i < count; i++ ) {
                    delete history[ i ];
                    this.available.redo = false;
                }
            }
                
            count = parseInt( Object.keys( history ).length + 1 );
            sessionStorage.setItem( 'historyPos', count );
            history[ count ] = this.scaleDown( this.draggables );
            sessionStorage.setItem( 'seatplan-history',  JSON.stringify( history ) );

            if ( parseInt( sessionStorage.getItem( 'historyPos' ) ) > 1 ) {
                this.available.undo = true;
            }

            this.save();
        },
        historyOp ( action ) {
            if ( action === 'undo' ) {
                if ( parseInt( sessionStorage.getItem( 'historyPos' ) ) > 1 ) {
                    sessionStorage.setItem( 'historyPos', parseInt( sessionStorage.getItem( 'historyPos' ) ) - 1 );
                    this.draggables = this.scaleUp( JSON.parse( sessionStorage.getItem( 'seatplan-history' ) )[ sessionStorage.getItem( 'historyPos' ) ] );
                    this.available.redo = true;
                    if ( parseInt( sessionStorage.getItem( 'historyPos' ) ) < 2 ) {
                        this.available.undo = false;
                    }
                } else {
                    this.available.undo = false;
                }
            } else if ( action === 'redo' ) {
                if ( parseInt( Object.keys( JSON.parse( sessionStorage.getItem( 'seatplan-history' ) ) ).length ) > parseInt( sessionStorage.getItem( 'historyPos' ) ) ) {
                    sessionStorage.setItem( 'historyPos', parseInt( sessionStorage.getItem( 'historyPos' ) ) + 1 );
                    this.draggables = this.scaleUp( JSON.parse( sessionStorage.getItem( 'seatplan-history' ) )[ sessionStorage.getItem( 'historyPos' ) ] );
                    this.available.undo = true;
                    if ( parseInt( Object.keys( JSON.parse( sessionStorage.getItem( 'seatplan-history' ) ) ).length ) < parseInt( sessionStorage.getItem( 'historyPos' ) ) + 1 ) {
                        this.available.redo = false;
                    }
                } else {
                    this.available.redo = false;
                }
            }
            this.historyPos = sessionStorage.getItem( 'historyPos' );
        },
        save () {
            sessionStorage.setItem( 'seatplan', JSON.stringify( this.scaleDown( this.draggables ) ) );
        },
        saveDraft () {
            if ( !this.getSeatCount() ) {
                this.$refs.notification.createNotification( 'Collision of seat count!', 10, 'error', 'normal' );
                return;
            }
            let progressNotification = this.$refs.notification.createNotification( 'Saving as draft', 5, 'progress', 'normal' );
            sessionStorage.setItem( 'seatplan', JSON.stringify( this.scaleDown( this.draggables ) ) );
            const options = {
                method: 'post',
                body: JSON.stringify( { 'data': { 'seatInfo': this.seatCountInfo, 'data': this.scaleDown( this.draggables ) }, 'location': sessionStorage.getItem( 'locationID' ) } ),
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                }
            };
            fetch( localStorage.getItem( 'url' ) + '/admin/api/saveSeatplanDraft', options ).then( res => {
                if ( res.status === 200 ) {
                    res.text().then( () => {
                        this.$refs.notification.cancelNotification( progressNotification );
                        this.$refs.notification.createNotification( 'Saved as draft', 5, 'ok', 'normal' );
                    } );
                } else if ( res.status === 403 ) {
                    this.$refs.notification.cancelNotification( progressNotification );
                    this.$refs.notification.createNotification( 'Unauthenticated', 5, 'ok', 'error' );
                }
            } );
        },
        deploy () {
            if ( !this.getSeatCount() ) {
                this.$refs.notification.createNotification( 'Collision of seat count!', 10, 'error', 'normal' );
                return;
            }
            let deployNotification = this.$refs.notification.createNotification( 'Deploying...', 5, 'progress', 'normal' );
            const options = {
                method: 'post',
                body: JSON.stringify( { 'data': { 'seatInfo': this.seatCountInfo, 'data': this.scaleDown( this.draggables ) }, 'location': sessionStorage.getItem( 'locationID' ) } ),
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                }
            };
            fetch( localStorage.getItem( 'url' ) + '/admin/api/saveSeatplan', options ).then( res => {
                if ( res.status === 200 ) {
                    res.text().then( () => {
                        this.$refs.notification.cancelNotification( deployNotification );
                        this.$refs.notification.createNotification( 'Deployed successfully', 5, 'ok', 'normal' );
                    } );
                } else if ( res.status === 403 ) {
                    this.$refs.notification.cancelNotification( deployNotification );
                    this.$refs.notification.createNotification( 'Unauthenticated', 5, 'ok', 'error' );
                }
            } );
        },
        addNewElement () {
            this.draggables[ Object.keys( this.draggables ).length + 1 ] = { 'x': 100, 'y': 100, 'h': 100, 'w': 250, 'active': false, 'draggable': true, 'resizable': true, 'id': ( Object.keys( this.draggables ).length + 1 ), 'origin': 1, 'shape': 'rectangular', 'type': 'seat', 'startingRow': 1, 'seatNumberingPosition': Object.keys( this.draggables ).length, 'sector': 'A', 'text': { 'text': 'TestText', 'textSize': 20, 'colour': '#20FFFF' }, 'ticketCount': 1, 'numberingDirection': 'left', 'category': '1' };
            this.saveHistory();
            document.getElementById( 'parent' ).scrollTop = 0;
            document.getElementById( 'parent' ).scrollLeft = 0;
            this.$refs.notification.createNotification( 'New component added successfully', 5, 'ok', 'normal' );
        },
        deleteSelected () {
            if ( this.active ) {
                this.draggables[ this.active ].active = true;
                if ( confirm( 'Do you really want to delete the selected item?' ) ) {
                    delete this.draggables[ this.active ];
                    this.saveHistory();
                    this.active = 0;
                    this.$refs.notification.createNotification( 'Successfully deleted component', 5, 'ok', 'normal' );
                }
            } else {
                this.$refs.notification.createNotification( 'Please select a seat first!', 5, 'error', 'normal' );
            }
        },
        handleUpdate ( value ) {
            this.draggables = value;
            this.selectedObject = value;
            this.saveHistory();
        },
        zoom ( scale ) {
            if ( scale == 1 ) {
                this.zoomFactor = 1;
                sessionStorage.setItem( 'zoom', this.zoomFactor );
                this.loadSeatplan();
            } else {
                if ( ( this.zoomFactor < 0.3 && scale < 0 ) || ( this.zoomFactor > 2.9 && scale > 0 ) ) {
                    if ( this.zoomFactor < 0.3 ) {
                        this.$refs.notification.createNotification( 'Minimum zoom factor reached', 5, 'warning', 'normal' );
                    } else {
                        this.$refs.notification.createNotification( 'Maximum zoom factor reached', 5, 'warning', 'normal' );
                    }
                } else {
                    this.zoomFactor += scale;
                }
                sessionStorage.setItem( 'zoom', this.zoomFactor );
                this.loadSeatplan();
            }
        },
        handleSeatCountInfo ( info ) {
            this.seatCountInfo[ 'details' ][ info.id ] = info.data;
            this.seatCountInfo[ 'details' ][ info.id ][ 'startingRow' ] = this.draggables[ info.id ].startingRow;
        },
        getSeatCount () {
            this.seatCountInfo[ 'count' ] = document.getElementsByClassName( 'seats' ).length;
            for ( let draggable in this.draggables ) {
                if ( this.draggables[ draggable ][ 'ticketCount' ] ) {
                    this.seatCountInfo[ 'count' ] += this.draggables[ draggable ][ 'ticketCount' ];
                }
            }
            // Remap seat count info
            this.seatCountInfo[ 'data' ] = {};
            for ( let element in this.seatCountInfo[ 'details' ] ) {
                if ( !this.seatCountInfo[ 'data' ][ this.draggables[ 1 ].sector ] ) {
                    this.seatCountInfo[ 'data' ][ this.draggables[ 1 ].sector ] = {};
                }
                if ( this.seatCountInfo[ 'data' ][ this.draggables[ 1 ].sector ][ this.draggables[ element ].seatNumberingPosition ] ) return false;
                this.seatCountInfo[ 'data' ][ this.draggables[ 1 ].sector ][ this.draggables[ element ].seatNumberingPosition ] = this.seatCountInfo[ 'details' ][ element ];
            }
            return true;
        },
    },
    created () {
        this.runHook();
        this.sizePoll = setInterval( this.eventHandler, 250 );
    },
    unmounted() {
        clearInterval( this.sizePoll );
        clearInterval( this.autoSave );
    },
};
</script>

<style scoped>
    .parent {
        height: 90vh;
        aspect-ratio: 16 / 9;
        top: 7.5vh;
        left: 3vw;
        position: absolute;
        border: black 1px solid;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        overflow: scroll;
    }

    .draggable-box {
        cursor: all-scroll;
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
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 7.5vh;
        left: 0.5vw;
        height: 90vh;
    }
    .toolbar button {
        margin-top: 10%;
        cursor: pointer;
    }

    .toolbar button:disabled {
        cursor: default;
    }
</style>
