<!--
*				libreevent - SetupStartView.vue
*
*	Created by Janis Hutz 05/14/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
-->

<template>
    <div class="wrapper">
        <div class="content">
            <img src="@/assets/logo.png" alt="libreevent logo" style="height: 40vh;">
            <h1 class="title">Welcome to libreǝvent!</h1>
            <i style="font-size: small;">All links during setup open in separate tabs</i>
            <p>Thank you for downloading libreǝvent, the free & open source event management solution. libreǝvent aims to help you save both time and money when hosting events, so you can focus on what really matters.</p>
            <p>Let's start by setting it up. We strongly encourage you to do the setup (and all administrative tasks for that matter) on a PC and to also have a look at the extensive documentation of the setup process <a href="https://libreevent.janishutz.com/docs/setup/setup" target="_blank">here</a></p>
            <button @click="setup();" class="button">Start setup</button>
        </div>
    </div>
</template>

<script>
import { useBackendStore } from '@/stores/backendStore.js';
import { mapStores } from 'pinia';

export default {
    data () {
        return {
            formData: {}
        };
    },
    computed: {
        ...mapStores( useBackendStore )
    },
    methods: {
        setup () {
            this.backendStore.addVisitedSetupPages( 'basics', true );
            this.$router.push( '/setup/basics' );
        }
    },
};
</script>
