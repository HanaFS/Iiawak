'use strict';
const express = require('express');
const router = express.Router();
const socialController = require('../Controllers/SocialController');
const { verifyToken } = require('../Middlewares/auth.middleware');

router.use(verifyToken);
router.post('/:id/follow', socialController.toggleFollow);
router.get('/:id/following', socialController.getFollowing);
router.get('/:id/followers', socialController.getFollowers);

module.exports = router;
