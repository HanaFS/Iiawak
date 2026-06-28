'use strict';
const express = require('express');
const router = express.Router();
const communityController = require('../Controllers/CommunityController');
const { verifyToken, optionalAuth } = require('../Middlewares/auth.middleware');

router.get('/posts/me', verifyToken, communityController.getMyPosts);
router.get('/feed', optionalAuth, communityController.getFeed);
router.get('/posts/:postId/comments', optionalAuth, communityController.getComments);

router.use(verifyToken);
router.post('/posts', communityController.createPost);
router.post('/posts/:id/fire', communityController.firePost);
router.put('/posts/:id', communityController.updatePost);
router.put('/posts/:id/hide', communityController.hidePost);
router.put('/posts/:id/unhide', communityController.unhidePost);
router.delete('/posts/:id', communityController.deletePost);
router.post('/posts/:postId/comments', communityController.createComment);
router.delete('/posts/:postId/comments/:commentId', communityController.deleteComment);

module.exports = router;
