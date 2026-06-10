'use strict';
const express           = require('express');
const router            = express.Router();
const EconomyController = require('../1_Presentation/Controllers/EconomyController');
const { verifyToken }   = require('../1_Presentation/Middlewares/auth.middleware');

router.get('/packages',          EconomyController.getPackages.bind(EconomyController));
router.post('/packages',         verifyToken, EconomyController.createPackage.bind(EconomyController));
router.put('/packages/:id',      verifyToken, EconomyController.updatePackage.bind(EconomyController));
router.delete('/packages/:id',   verifyToken, EconomyController.deletePackage.bind(EconomyController));

module.exports = router;
