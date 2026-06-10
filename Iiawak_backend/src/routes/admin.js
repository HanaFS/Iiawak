'use strict';
const express          = require('express');
const router           = express.Router();
const AdminController  = require('../1_Presentation/Controllers/AdminController');
const { adminOnly }    = require('../1_Presentation/Middlewares/auth.middleware');

router.use(adminOnly);

router.get('/dashboard',                AdminController.getDashboard.bind(AdminController));
router.get('/users',                    AdminController.getUsers.bind(AdminController));
router.get('/users/:id',               AdminController.getUserDetail.bind(AdminController));
router.put('/users/:id/ban',           AdminController.manageUser.bind(AdminController));
router.post('/users/:id/adjust-kch',   AdminController.adjustUserKch.bind(AdminController));

router.get('/characters',              AdminController.getCharacters.bind(AdminController));
router.put('/characters/:id',          AdminController.updateCharacter.bind(AdminController));
router.delete('/characters/:id',       AdminController.deleteCharacter.bind(AdminController));

router.get('/posts',                   AdminController.getPosts.bind(AdminController));
router.delete('/posts/:id',            AdminController.deletePost.bind(AdminController));

module.exports = router;
