'use strict';
const express           = require('express');
const router            = express.Router();
const SocialController  = require('../controllers/SocialController');
const { verifyToken }   = require('../middlewares/auth.middleware');

// Theo dõi / Bỏ theo dõi
router.post('/follow/:targetId',  verifyToken, SocialController.toggleFollow.bind(SocialController));

// Danh sách đang theo dõi
router.get('/following',          verifyToken, SocialController.getFollowing.bind(SocialController));

// Danh sách người theo dõi mình
router.get('/followers',          verifyToken, SocialController.getFollowers.bind(SocialController));

module.exports = router;
