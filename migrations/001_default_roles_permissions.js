const fs = require('fs');
const path = require('path');
const {ObjectId} = require('mongodb');

const createRole = async (db, roleData) => {
    const existingRole = await db.collection('roles').findOne({name: roleData.name});

    if (existingRole) {
        console.log(`${roleData.name} role already exists.`);
        return existingRole;
    }

    try {
        const result = await db.collection('roles').insertOne(roleData);
        const insertedId = result.insertedId;
        console.log(`${roleData.name} role created successfully.`);
        return await db.collection('roles').findOne({_id: insertedId});
    } catch (error) {
        console.error(`Error creating ${roleData.name} role:`, error);
        throw error;
    }
};

const createPermissions = async (db, permissionsData) => {
    const existingPermissions = await db.collection('permissions').find({}).toArray();
    const existingPermissionIds = existingPermissions.map((p) => String(p._id));
    const newPermissionsData = permissionsData.filter(
        (p) => !existingPermissionIds.includes(String(p._id))
    );

    if (newPermissionsData.length === 0) {
        console.log('No new permissions to create.');
        return;
    }

    try {
        const result = await db.collection('permissions').insertMany(newPermissionsData);
        console.log(`${result.insertedCount} new permissions created.`);
    } catch (error) {
        console.error('Error creating new permissions:', error);
        throw error;
    }
};


const updateUsersWithNewRoleIds = async (db, oldRoleIds, newRoleIds) => {
    for (let i = 0; i < oldRoleIds.length; i++) {
        const oldRoleId = oldRoleIds[i];
        const newRoleId = newRoleIds[i];
        await db.collection('users').updateMany(
            {role: new ObjectId(oldRoleId)},
            {$set: {role: new ObjectId(newRoleId)}}
        );
    }
}

const removeDuplicates = (permissions) => {
    return permissions.filter((permission, index, self) =>
            index === self.findIndex((p) => (
                p.action === permission.action && p.subject === permission.subject
            ))
    );
};

module.exports = {
    async up(db) {


        // Read the permission data from files
        const adminPermissions = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'permissions.json'), 'utf-8')
        );
        const subscriberPermissions = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'subscriber.json'), 'utf-8')
        );
        const farmerPermissions = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'farmer.json'), 'utf-8')
        );
        const carrierPermissions = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'carrier.json'), 'utf-8')
        );
        const institutePermissions = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'institute.json'), 'utf-8')
        );

        // Remove duplicates from permission arrays
        const adminPermissionsUnique = removeDuplicates(adminPermissions);
        const subscriberPermissionsUnique = removeDuplicates(subscriberPermissions);
        const farmerPermissionsUnique = removeDuplicates(farmerPermissions);
        const carrierPermissionsUnique = removeDuplicates(carrierPermissions);
        const institutePermissionsUnique = removeDuplicates(institutePermissions);

        // Combine all permissions and remove duplicates
        const combinedPermissions = [
            ...adminPermissionsUnique,
            ...subscriberPermissionsUnique,
            ...farmerPermissionsUnique,
            ...carrierPermissionsUnique,
            ...institutePermissionsUnique
        ];

        const uniquePermissions = Array.from(new Set(combinedPermissions.map(JSON.stringify))).map(JSON.parse).filter((permission, index, self) =>
                index === self.findIndex((p) => (
                    p.action === permission.action && p.subject === permission.subject
                ))
        );

        // Insert unique permissions to the database
        const createPermissions = async (db, permissionsData) => {
            const bulkOps = permissionsData.map(permission => ({
                updateOne: {
                    filter: {action: permission.action, subject: permission.subject},
                    update: {$set: permission},
                    upsert: true,
                }
            }));

            if (bulkOps.length === 0) {
                console.log('No new permissions to create.');
                return;
            }

            try {
                const result = await db.collection('permissions').bulkWrite(bulkOps);
                console.log(`Permissions upserted: ${result.upsertedCount}`);
            } catch (error) {
                console.error('Error creating new permissions:', error);
                throw error;
            }
        };

        // Get the inserted permissions from the database
        const insertedPermissions = await db.collection('permissions').find({}).toArray();

        // Create a helper function to get ObjectId of permissions based on action and subject
        const getPermissionObjectId = (action, subject) => {
            const permission = insertedPermissions.find(p => p.action === action && p.subject === subject);
            return permission ? new ObjectId(permission._id) : null;
        };

        // Create all the roles
        const adminRole = await createRole(db, {
            name: 'admin',
            code: 1000,
            permissions: adminPermissions.map(p => getPermissionObjectId(p.action, p.subject)).filter(id => id),
        });

        const subscriberRole = await createRole(db, {
            name: 'subscriber',
            code: 2000,
            permissions: subscriberPermissions.map(p => getPermissionObjectId(p.action, p.subject)).filter(id => id),
        });

        const farmerRole = await createRole(db, {
            name: 'farmer',
            code: 3000,
            permissions: farmerPermissions.map(p => getPermissionObjectId(p.action, p.subject)).filter(id => id),
        });

        const carrierRole = await createRole(db, {
            name: 'carrier',
            code: 4000,
            permissions: carrierPermissions.map(p => getPermissionObjectId(p.action, p.subject)).filter(id => id),
        });

        const instituteRole = await createRole(db, {
            name: 'institution',
            code: 5000,
            permissions: institutePermissions.map(p => getPermissionObjectId(p.action, p.subject)).filter(id => id),
        });

        const oldRoleIds = [adminRole, subscriberRole, farmerRole, carrierRole, instituteRole].map(
            (role) => role._id
        );


        const newRoleIds = [
            adminRole._id,
            subscriberRole._id,
            farmerRole._id,
            carrierRole._id,
            instituteRole._id,
        ];

        // Update users with the new role IDs
        await updateUsersWithNewRoleIds(db, oldRoleIds, newRoleIds);
    },


    async down(db) {
        const roles = ['admin', 'farmer', 'carrier', 'subscriber', 'institution'];
        await db.collection('roles').deleteMany({name: {$in: roles}});
    },
};






