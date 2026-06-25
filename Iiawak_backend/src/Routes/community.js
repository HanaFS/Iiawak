'use strict';
const express = require('express');
const router = express.Router();
const communityController = require('../Controllers/CommunityController');
const { verifyToken, optionalAuth } = require('../Middlewares/auth.middleware');

router.get('/feed', optionalAuth, communityController.getFeed);
router.get('/posts/:postId/comments', optionalAuth, communityController.getComments);

router.use(verifyToken);
router.post('/posts', communityController.createPost);
router.post('/posts/:id/fire', communityController.firePost);
router.delete('/posts/:id', communityController.deletePost);
router.post('/posts/:postId/comments', communityController.createComment);

module.exports = router;
