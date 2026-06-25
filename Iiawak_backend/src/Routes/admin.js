'use strict';
const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/AdminController');
const { verifyToken, adminOnly } = require('../Middlewares/auth.middleware');

router.use(verifyToken, adminOnly);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.post('/users/:id/manage', adminController.manageUser);
router.post('/users/:id/adjust-kch', adminController.adjustUserKch);
router.get('/characters', adminController.getCharacters);
router.put('/characters/:id', adminController.updateCharacter);
router.delete('/characters/:id', adminController.deleteCharacter);
router.get('/posts', adminController.getPosts);
router.delete('/posts/:id', adminController.deletePost);

module.exports = router;
