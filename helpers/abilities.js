const {AbilityBuilder, createMongoAbility} = require('@casl/ability');
const User = require('../models/user');


exports.buildAbilityForUser = async (userId) => {
    const user = await User.findById(userId).populate({path: 'role', populate: {path: 'permissions'}});
    if (!user) {
        throw new Error(`User with id ${userId} not found`);
    }
    console.log('USER',user);

    const {can, cannot, build} = new AbilityBuilder(createMongoAbility);

    const permissions = user.role.permissions;

    permissions.forEach((permission) => {
        const [action, subject] = permission.name.split(':');
        can(action, subject, permission.conditions);
    });

    return build({can, cannot});
};
