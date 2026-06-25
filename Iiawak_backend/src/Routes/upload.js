'use strict';
const express = require('express');
const router = express.Router();
const uploadController = require('../Controllers/UploadController');
const { verifyToken } = require('../Middlewares/auth.middleware');
const uploadMiddleware = require('../Middlewares/upload.middleware');

router.use(verifyToken);
router.post('/user-avatar', uploadMiddleware.uploadSingleAvatar, uploadController.uploadUserAvatar);
router.post('/character-avatar', uploadMiddleware.uploadSingleAvatar, uploadController.uploadCharacterAvatar);
router.post('/post-images', uploadMiddleware.uploadPostImages, uploadController.uploadPostImages);

module.exports = router;
