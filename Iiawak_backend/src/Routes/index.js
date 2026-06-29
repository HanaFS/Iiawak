'use strict';
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/user', require('./user'));
router.use('/admin', require('./admin'));
router.use('/chat', require('./chat'));
router.use('/community', require('./community'));
router.use('/economy', require('./economy'));
router.use('/giftcodes', require('./giftcodes'));
router.use('/payment', require('./payment'));
router.use('/social', require('./social'));
router.use('/upload', require('./upload'));
router.use('/characters', require('./characters'));
router.use('/transactions', require('./transaction'));
router.use('/config', require('./config'));

module.exports = router;
