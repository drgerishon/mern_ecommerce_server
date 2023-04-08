// abilities.js
const { AbilityBuilder, createMongoAbility } = require('@casl/ability');
const User = require('mongoose').model('User');

const {CustomError} = require("../middlewares/errorHandler");


const defineAbilitiesFor = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'role',
    populate: { path: 'permissions' },
  });

  if (!user) {
    throw new CustomError(404, `User with id ${userId} not found`);
  }

  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  const permissions = user.role.permissions;

  permissions.forEach((permission) => {
    can(permission.action, permission.subject);
  });

  return build({ can, cannot });
};

module.exports = { defineAbilitiesFor };
