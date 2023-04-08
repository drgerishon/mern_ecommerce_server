const Route = require('../models/route');
const Permission = require('../models/permission');

const routesAndPermissions = [
    {
        path: '/routes',
        method: 'GET',
        category: 'route',
        allowed: [
            {action: 'read', subject: 'Route'},
        ],
    },
    {
        path: '/routes',
        method: 'POST',
        category: 'route',
        allowed: [
            {action: 'create', subject: 'Route'},
        ],
    },
    {
        path: '/routes/:id',
        method: 'PUT',
        category: 'route',
        allowed: [
            {action: 'update', subject: 'Route'},
        ],
    },
    {
        path: '/routes/:id',
        method: 'DELETE',
        category: 'route',
        allowed: [
            {action: 'delete', subject: 'Route'},
        ],
    },
    {
        path: '/roles',
        method: 'GET',
        category: 'role',
        allowed: [
            {action: 'read', subject: 'Role'},
        ],
    },
    {
        path: '/roles',
        method: 'POST',
        category: 'role',
        allowed: [
            {action: 'create', subject: 'Role'},
        ],
    },
    {
        path: '/roles/:id',
        method: 'PUT',
        category: 'role',
        allowed: [
            {action: 'update', subject: 'Role'},
        ],
    },
    {
        path: '/roles/:id',
        method: 'DELETE',
        category: 'role',
        allowed: [
            {action: 'delete', subject: 'Role'},
        ],
    },
    // Add more routes and permissions as needed
];

async function dropOldIndex(db) {
    try {
        await db.collection('routes').dropIndex('path_1');
        console.log('Dropped old index');
    } catch (error) {
        console.log('No old index found');
    }
}

async function createRouteWithPermissions(db, routeData) {
    const permissions = await Promise.all(
        routeData.allowed.map(async (permissionData) => {
            return await db
                .collection('permissions')
                .findOne({action: permissionData.action, subject: permissionData.subject});
        })
    );

    // Filter out any undefined permissions (not found in the database)
    const validPermissions = permissions.filter((permission) => permission !== undefined);

    // If the number of validPermissions is equal to the number of allowed permissions,
    // it means all the permissions exist in the database and we can create the route.
    if (validPermissions.length === routeData.allowed.length) {
        const permissionIds = validPermissions.map((permission) => permission._id);

        await db.collection('routes').insertOne({
            path: routeData.path,
            method: routeData.method,
            category: routeData.category,
            permissions: permissionIds,
        });
    } else {
        console.log(
            `Route creation ignored for path: ${routeData.path} and method: ${routeData.method} due to missing permissions.`
        );
    }
}


module.exports = {
    async up(db) {
        await dropOldIndex(db);
        await Promise.all(
            routesAndPermissions.map((routeData) =>
                createRouteWithPermissions(db, routeData)
            )
        );
    },

    async down(db) {
        const routePaths = routesAndPermissions.map((route) => route.path);

        await db.collection('routes').deleteMany({path: {$in: routePaths}});

    },
};
