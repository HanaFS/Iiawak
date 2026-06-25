'use strict';
const express = require('express');
const router = express.Router();
const paymentController = require('../Controllers/PaymentController');
const { verifyToken } = require('../Middlewares/auth.middleware');

router.post('/vnpay/create-url', verifyToken, paymentController.createPaymentUrl);
router.get('/vnpay/vnpay_return', paymentController.handleReturn);
router.post('/vnpay/webhook', paymentController.vnpayWebhook);

router.use(verifyToken);
router.get('/transactions', paymentController.getUserTransactions);
router.get('/transactions/:id/status', paymentController.getTransactionStatus);
router.post('/transactions/:id/refund', paymentController.refundTransaction);

module.exports = router;
