'use strict';
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { verifyToken, adminOnly } = require('../middlewares/auth.middleware');

/**
 * POST /api/payment/vnpay/create-url
 * Tạo URL thanh toán VNPay
 * Auth: Required
 */
router.post(
  '/vnpay/create-url',
  verifyToken,
  PaymentController.createPaymentUrl.bind(PaymentController)
);

/**
 * POST /api/payment/vnpay/webhook
 * Webhook từ VNPay (IPN Callback)
 * Auth: None (VNPay verify via signature)
 */
router.post(
  '/vnpay/webhook',
  PaymentController.vnpayWebhook.bind(PaymentController)
);

/**
 * GET /api/payment/vnpay/return
 * Return URL sau khi user hoàn thành thanh toán trên VNPay
 * Auth: None
 */
router.get(
  '/vnpay/return',
  PaymentController.handleReturn.bind(PaymentController)
);

/**
 * GET /api/payment/transaction/:txId
 * Lấy trạng thái giao dịch
 * Auth: Required (hoặc admin)
 */
router.get(
  '/transaction/:txId',
  verifyToken,
  PaymentController.getTransactionStatus.bind(PaymentController)
);

/**
 * GET /api/payment/transactions
 * Lấy danh sách giao dịch của user
 * Query params: type, status, page, limit
 * Auth: Required
 */
router.get(
  '/transactions',
  verifyToken,
  PaymentController.getUserTransactions.bind(PaymentController)
);

/**
 * PUT /api/payment/refund/:txId
 * Hoàn tiền giao dịch (Admin only)
 * Auth: Admin
 */
router.put(
  '/refund/:txId',
  verifyToken,
  adminOnly,
  PaymentController.refundTransaction.bind(PaymentController)
);

module.exports = router;
