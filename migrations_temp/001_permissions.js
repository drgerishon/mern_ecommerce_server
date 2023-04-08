const fs = require('fs');
const path = require('path');

const farmerPermissions = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'farmer.json'), 'utf-8'));
const carrierPermissions = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'carrier.json'), 'utf-8'));
const institutePermissions = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'institute.json'), 'utf-8'));
const subscriberPermissions = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'subscriber.json'), 'utf-8'));
const allPermissions = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'permissions.json'), 'utf-8'));

const permissions = [
    ...farmerPermissions,
    ...carrierPermissions,
    ...institutePermissions,
    ...subscriberPermissions,
    ...allPermissions
];

// Create an array of unique permissions based on the action and subject fields
const uniquePermissions = permissions.reduce((unique, permission) => {
    const {action, subject} = permission;
    const existingPermission = unique.find(p => p.action === action && p.subject === subject);
    if (!existingPermission) {
        return [...unique, permission];
    }
    return unique;
}, []);

async function createPermissionIfNotExists(db, permissionData) {
    const {action, subject} = permissionData;
    const existingPermission = await db.collection('permissions').findOne({action, subject});

    if (existingPermission) {
        return existingPermission;
    }

    try {
        const result = await db.collection('permissions').insertOne(permissionData);
        const insertedId = result.insertedId;
        return await db.collection('permissions').findOne({_id: insertedId});
    } catch (error) {
        console.error('Error inserting permission:', error);
        throw error;
    }
}

async function dropPermissionsCollection(db) {
    try {
        await db.collection('permissions').drop();
        console.log('Dropped permissions collection');
    } catch (error) {
        console.log('No permissions collection found');
    }
}

module.exports = {
    async up(db) {
        // Drop the permissions collection if it exists
        await dropPermissionsCollection(db);

        // Recreate the permissions collection and seed it
        await Promise.all(
            uniquePermissions.map(permissionData => createPermissionIfNotExists(db, permissionData))
        );
        console.log('inserted permissions successfully')
    },
    async down(db) {
        const permissionActions = uniquePermissions.map(permission => permission.action);
        const permissionSubjects = uniquePermissions.map(permission => permission.subject);
        await db.collection('permissions').deleteMany({
            action: {$in: permissionActions},
            subject: {$in: permissionSubjects},
        });
    },
};
