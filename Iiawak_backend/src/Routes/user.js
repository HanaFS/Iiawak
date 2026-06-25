'use strict';
const express = require('express');
const router = express.Router();
const userController = require('../Controllers/UserController');
const { verifyToken } = require('../Middlewares/auth.middleware');

router.use(verifyToken);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/checkin', userController.checkin);
router.get('/transactions', userController.getTransactions);
router.get('/suggested-friends', userController.getSuggestedFriends);
router.post('/:id/follow', userController.toggleFollow);
router.put('/change-password', userController.changePassword);

module.exports = router;
