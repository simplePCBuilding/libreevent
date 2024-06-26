/*
*				libreevent - adminRoutes.js
*
*	Created by Janis Hutz 05/12/2023, Licensed under the GPL V3 License
*			https://janishutz.com, development@janishutz.com
*
*
*/

export default {
    path: '/admin',
    name: 'admin',
    component: () => import( '../views/admin/AdminView.vue' ),
    meta: {
        title: 'Admin - ',
        adminAuthRequired: true,
    },
    children: [
        {
            path: '',
            name: 'adminHome',
            component: () => import( '../views/admin/HomeView.vue' ),
            meta: {
                title: 'Home :: Admin - ',
                adminAuthRequired: true,
            }
        },
        {
            path: 'locations',
            name: 'adminLocations',
            component: () => import( '../views/admin/LocationsView.vue' ),
            meta: {
                title: 'Accounts :: Admin - ',
                adminAuthRequired: true,
                permissions: 'root'
            }
        },
        {
            path: 'pages',
            name: 'adminPages',
            component: () => import( '../views/admin/PagesView.vue' ),
            meta: {
                title: 'Pages :: Admin - ',
                adminAuthRequired: true,
            }
        },
        {
            path: 'events',
            name: 'adminEvents',
            component: () => import( '../views/admin/EventsView.vue' ),
            meta: {
                title: 'Events :: Admin - ',
                adminAuthRequired: true,
            },
        },
        {
            path: 'plugins',
            name: 'adminPlugins',
            component: () => import( '../views/admin/PluginsView.vue' ),
            meta: {
                title: 'Plugins :: Admin - ',
                adminAuthRequired: true,
            }
        },
        {
            path: 'settings',
            name: 'adminSettings',
            component: () => import( '../views/admin/SettingsView.vue' ),
            meta: {
                title: 'Admin - ',
                adminAuthRequired: true,
            }
        },
        {
            path: 'events/view',
            name: 'eventDetails',
            component: () => import( '../views/admin/events/EventsDetailsView.vue' ),
            meta: {
                title: 'Event details :: Admin - ',
                adminAuthRequired: true,
            }
        },
        {
            path: 'events/analytics',
            name: 'eventAnalytics',
            component: () => import( '../views/admin/events/AnalyticsView.vue' ),
            meta: {
                title: 'Event analytics :: Admin - ',
                adminAuthRequired: true,
            }
        },
    ]
};