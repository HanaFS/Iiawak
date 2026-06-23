'use strict';
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./user'));
router.use('/characters', require('./characters'));
router.use('/chat', require('./chat'));
router.use('/community', require('./community'));
router.use('/social', require('./social'));
router.use('/payment', require('./payment'));
router.use('/economy', require('./economy'));
router.use('/upload', require('./upload'));
router.use('/admin', require('./admin'));
router.use('/giftcodes', require('./giftcodes'));

module.exports = router;
