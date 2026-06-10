'use strict';
const VNPayService = require('../../2_BusinessLogic/Services/VNPayService');
const AppError = require('../../4_Core/Exceptions/AppError');

/**
 * PaymentController — Gác cổng cho /api/payment/*
 * Xử lý payment gateway integration (VNPay)
 */
class PaymentController {
  /**
   * Tạo URL thanh toán VNPay
   * POST /api/payment/vnpay/create-url
   * Body: { packageId, amount }
   */
  async createPaymentUrl(req, res) {
    try {
      const userId = req.user.id;
      const { packageId, amount } = req.body;

      if (!packageId || !amount) {
        throw AppError.badRequest('packageId và amount bắt buộc');
      }

      if (amount <= 0) {
        throw AppError.badRequest('Số tiền phải lớn hơn 0');
      }

      const result = await VNPayService.createPaymentUrl({
        userId,
        packageId,
        amount,
      });

      res.json({
        success: true,
        data: {
          vnp_Url: result.vnp_Url,
          txId: result.txId,
          amountKch: result.amountKch,
          bonus: result.bonus,
          transactionId: result.transactionId,
        },
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message,
        errorCode: err.errorCode,
      });
    }
  }

  /**
   * Webhook từ VNPay (IPN Callback)
   * POST /api/payment/vnpay/webhook
   * Không cần authentication
   */
  async vnpayWebhook(req, res) {
    try {
      const vnp_Params = req.query || req.body;

      const result = await VNPayService.verifyWebhook(vnp_Params);

      // VNPay yêu cầu response 200 OK với statusCode
      if (result.statusCode === 0) {
        console.log('✅ VNPay webhook processed successfully');
      } else {
        console.warn(`⚠️ VNPay webhook error: ${result.message}`);
      }

      res.status(200).json(result);
    } catch (err) {
      console.error('VNPay webhook error:', err);
      res.status(200).json({
        statusCode: 99,
        message: 'Unknown error',
      });
    }
  }

  /**
   * Lấy trạng thái giao dịch
   * GET /api/payment/transaction/:txId
   */
  async getTransactionStatus(req, res) {
    try {
      const { txId } = req.params;

      const transaction = await VNPayService.getTransactionStatus(txId);

      res.json({
        success: true,
        data: transaction,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Lấy danh sách giao dịch của user
   * GET /api/payment/transactions?type=TOPUP&status=success&page=1&limit=20
   */
  async getUserTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { type, status, page = 1, limit = 20 } = req.query;

      const skip = (page - 1) * limit;

      const result = await VNPayService.getUserTransactions(userId, {
        skip,
        limit: parseInt(limit),
        type,
        status,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Hoàn tiền giao dịch (Admin only)
   * PUT /api/payment/refund/:txId
   * Body: { reason }
   */
  async refundTransaction(req, res) {
    try {
      // Check if admin
      if (req.user.role !== 'admin') {
        throw AppError.forbidden('Chỉ admin mới có thể hoàn tiền');
      }

      const { txId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw AppError.badRequest('Lý do hoàn tiền bắt buộc');
      }

      const result = await VNPayService.refundTransaction(txId, reason);

      res.json({
        success: true,
        message: 'Hoàn tiền thành công',
        data: result,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Return URL (redirect sau khi thanh toán)
   * GET /api/payment/return
   */
  async handleReturn(req, res) {
    try {
      const { vnp_TxnRef, vnp_ResponseCode } = req.query;

      if (vnp_ResponseCode === '00') {
        // Thanh toán thành công - redirect tới trang success
        res.json({
          success: true,
          message: 'Thanh toán thành công',
          txId: vnp_TxnRef,
        });
      } else {
        // Thanh toán thất bại
        res.json({
          success: false,
          message: 'Thanh toán thất bại',
          responseCode: vnp_ResponseCode,
          txId: vnp_TxnRef,
        });
      }
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new PaymentController();
