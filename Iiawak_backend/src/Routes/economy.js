'use strict';
const express = require('express');
const router = express.Router();
const economyController = require('../Controllers/EconomyController');
const { verifyToken, adminOnly } = require('../Middlewares/auth.middleware');

router.get('/packages', economyController.getPackages);

router.use(verifyToken, adminOnly);
router.post('/packages', economyController.createPackage);
router.put('/packages/:id', economyController.updatePackage);
router.delete('/packages/:id', economyController.deletePackage);

module.exports = router;
