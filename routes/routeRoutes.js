const {adminCheck, requireSignin, authCheck} = require('../middlewares/auth')
const {createRole, listRoles, updateRole, deleteRole} = require("../controllers/role");
const express = require('express')
const {authorize} = require("../middlewares/authorize");
const {roleValidationRules} = require("../validators/role");
const {runValidation} = require("../validators");
const router = express.Router()
// Add this to your routes file
router.get('/routes', requireSignin, adminCheck, authorize('read', 'Route'), listRoutes);
router.post('/routes', requireSignin, adminCheck, authorize('create', 'Route'), routeValidationRules, runValidation, createRoute);
router.put('/routes/:id', requireSignin, adminCheck, authorize('update', 'Route'), routeValidationRules, runValidation, updateRoute);
router.delete('/routes/:id', requireSignin, adminCheck, authorize('delete', 'Route'), deleteRoute);


module.exports = router;


module.exports = router
