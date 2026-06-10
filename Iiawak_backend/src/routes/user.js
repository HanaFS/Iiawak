'use strict';
const express    = require('express');
const router     = express.Router();
const UserController = require('../1_Presentation/Controllers/UserController');
const { verifyToken } = require('../1_Presentation/Middlewares/auth.middleware');

router.get('/profile',             verifyToken, UserController.getProfile.bind(UserController));
router.put('/profile',             verifyToken, UserController.updateProfile.bind(UserController));
router.put('/change-password',     verifyToken, UserController.changePassword.bind(UserController));
router.post('/checkin',            verifyToken, UserController.checkin.bind(UserController));
router.get('/transactions',        verifyToken, UserController.getTransactions.bind(UserController));
router.get('/suggested-friends',   verifyToken, UserController.getSuggestedFriends.bind(UserController));
router.post('/follow/:targetId',   verifyToken, UserController.toggleFollow.bind(UserController));

module.exports = router;
