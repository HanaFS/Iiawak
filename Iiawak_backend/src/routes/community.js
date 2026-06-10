'use strict';
const express             = require('express');
const router              = express.Router();
const CommunityController = require('../1_Presentation/Controllers/CommunityController');
const { verifyToken, optionalAuth } = require('../1_Presentation/Middlewares/auth.middleware');

// ── Posts ──────────────────────────────────────────────────────────────────────
router.get('/feed',              optionalAuth,  CommunityController.getFeed.bind(CommunityController));
router.post('/posts',            verifyToken,   CommunityController.createPost.bind(CommunityController));
router.post('/posts/:id/fire',   verifyToken,   CommunityController.firePost.bind(CommunityController));
router.delete('/posts/:id',      verifyToken,   CommunityController.deletePost.bind(CommunityController));

// ── Comments ──────────────────────────────────────────────────────────────────
router.get('/posts/:postId/comments',  CommunityController.getComments.bind(CommunityController));
router.post('/posts/:postId/comments', verifyToken, CommunityController.createComment.bind(CommunityController));

module.exports = router;
