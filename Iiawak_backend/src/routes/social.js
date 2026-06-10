'use strict';
const express           = require('express');
const router            = express.Router();
const SocialController  = require('../1_Presentation/Controllers/SocialController');
const { verifyToken }   = require('../1_Presentation/Middlewares/auth.middleware');

// Theo dõi / Bỏ theo dõi
router.post('/follow/:targetId',  verifyToken, SocialController.toggleFollow.bind(SocialController));

// Danh sách đang theo dõi
router.get('/following',          verifyToken, SocialController.getFollowing.bind(SocialController));

// Danh sách người theo dõi mình
router.get('/followers',          verifyToken, SocialController.getFollowers.bind(SocialController));

module.exports = router;
