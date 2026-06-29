'use strict';
const crypto = require('crypto');
const querystring = require('querystring');
const config = require('../config');
const economyRepository = require('../Repositories/EconomyRepository');
const userRepository = require('../Repositories/UserRepository');
const AppError = require('../Exceptions/AppError');
const formatUtil = require('../Utils/formatUtil');
const { TransactionType } = require('../Constants/appConstants');

/**
 * VNPayService — Xử lý tích hợp với VNPay
 * Tạo link thanh toán, xác thực webhook, cập nhật trạng thái giao dịch
 */
class VNPayService {
  constructor() {
    // VNPay Configuration
    this.vnp_TmnCode = config.vnpay.tmnCode || '';
    this.vnp_HashSecret = config.vnpay.hashSecret || '';
    this.vnp_Url = config.vnpay.url || 'https://sandbox.vnpayment.vn/paygate';
    this.vnp_ReturnUrl = config.vnpay.returnUrl || 'http://localhost:3000/payment-result';
    this.vnp_Api = config.vnpay.api || 'https://api.vnpayment.vn/';

    if (!this.vnp_TmnCode || !this.vnp_HashSecret) {
      console.warn('⚠️  VNPay credentials not configured. Payment functionality disabled.');
    }
  }

  /**
   * Tạo URL thanh toán VNPay
   * @param {Object} data - { userId, packageId, amount }
   * @returns {Promise<{vnp_Url: string, txId: string}>}
   */
  async createPaymentUrl(data) {
    const { userId, packageId, amount } = data;

    // Xác thực user
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('Người dùng');

    // Xác thực gói nạp
    const pkg = await economyRepository.findPackageById(packageId);
    if (!pkg) throw AppError.notFound('Gói nạp không tồn tại');

    // Tạo transaction ID
    const txId = formatUtil.txId('VNP');

    // Tạo giao dịch pending
    const transaction = await userRepository.createTransaction({
      txId,
      userId,
      amountKch: pkg.kch,
      priceVnd: amount,
      type: TransactionType.TOPUP,
      status: 'pending',
      paymentMethod: 'VNPAY',
      packageId,
    });

    // Lấy thời gian hiện tại và thêm 15 phút
    const now = new Date();
    const expireTime = new Date(now.getTime() + 15 * 60000);

    // Tạo params cho VNPay
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txId;
    vnp_Params['vnp_OrderInfo'] = `Nap ${pkg.kch} KCH + ${pkg.bonus} Bonus`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay tính bằng đơn vị nhỏ nhất (x100)
    vnp_Params['vnp_ReturnUrl'] = this.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = '127.0.0.1'; // Nên lấy từ request
    vnp_Params['vnp_CreateDate'] = this.formatDate(now);
    vnp_Params['vnp_ExpireDate'] = this.formatDate(expireTime);

    // Sắp xếp params theo alphabetical order
    vnp_Params = this.sortObject(vnp_Params);

    // Tạo query string
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    // Xây dựng URL thanh toán
    const vnp_Url = this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

    return {
      vnp_Url,
      txId,
      amountKch: pkg.kch,
      bonus: pkg.bonus,
      transactionId: transaction._id,
    };
  }

  /**
   * Xác thực webhook từ VNPay (IPN)
   * @param {Object} vnp_Params - VNPay webhook parameters
   * @returns {Promise<{statusCode: number, message: string}>}
   */
  async verifyWebhook(vnp_Params) {
    try {
      // Copy params để xóa SecureHash
      let secureHash = vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      // Sắp xếp params
      vnp_Params = this.sortObject(vnp_Params);

      // Tạo checksum
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
      let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // Kiểm tra signature
      if (secureHash !== signed) {
        return {
          statusCode: 97, // Invalid signature
          message: 'Invalid signature',
        };
      }

      // Kiểm tra mã giao dịch
      const transactionId = vnp_Params['vnp_TxnRef'];
      const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];

      // Tìm giao dịch
      const transaction = await userRepository.findTransactionByTxId(transactionId);
      if (!transaction) {
        return {
          statusCode: 1, // Order not found
          message: 'Order not found',
        };
      }

      // Cập nhật trạng thái giao dịch dựa trên response code
      if (vnp_ResponseCode === '00') {
        // Thanh toán thành công
        await this.handlePaymentSuccess(transaction, vnp_Params);
        return {
          statusCode: 0, // Success
          message: 'Confirm Success',
        };
      } else {
        // Thanh toán thất bại
        await userRepository.updateTransaction(transaction._id, {
          status: 'failed',
          vnp_ResponseCode,
          vnp_TransactionNo: vnp_Params['vnp_TransactionNo'],
          vnp_BankCode: vnp_Params['vnp_BankCode'],
        });
        return {
          statusCode: 0,
          message: 'Payment failed',
        };
      }
    } catch (error) {
      console.error('VNPay webhook error:', error);
      return {
        statusCode: 99, // Unknown error
        message: 'Unknown error',
      };
    }
  }

  /**
   * Xử lý thanh toán thành công
   * @param {Object} transaction - Transaction document
   * @param {Object} vnp_Params - VNPay parameters
   */
  async handlePaymentSuccess(transaction, vnp_Params) {
    // Cập nhật trạng thái giao dịch
    await userRepository.updateTransaction(transaction._id, {
      status: 'success',
      vnp_TransactionNo: vnp_Params['vnp_TransactionNo'],
      vnp_BankCode: vnp_Params['vnp_BankCode'],
      vnp_BankTranNo: vnp_Params['vnp_BankTranNo'],
      vnp_PayDate: vnp_Params['vnp_PayDate'],
    });

    // Cộng KCH vào user balance
    const User = require('../Models/User.model');
    await User.findByIdAndUpdate(transaction.userId, {
      $inc: { kchBalance: transaction.amountKch },
    });

    // Log event

  }

  /**
   * Kiểm tra trạng thái giao dịch
   * @param {string} transactionId - Transaction ID (txId)
   * @returns {Promise<Object>}
   */
  async getTransactionStatus(transactionId) {
    const transaction = await userRepository.findTransactionByTxId(transactionId);
    if (!transaction) {
      throw AppError.notFound('Giao dịch không tồn tại');
    }

    return {
      txId: transaction.txId,
      status: transaction.status,
      amountKch: transaction.amountKch,
      priceVnd: transaction.priceVnd,
      type: transaction.type,
      createdAt: transaction.createdAt,
      paymentMethod: transaction.paymentMethod,
      vnp_TransactionNo: transaction.vnp_TransactionNo,
      vnp_BankCode: transaction.vnp_BankCode,
    };
  }

  /**
   * Hoàn tiền giao dịch (admin only)
   * @param {string} transactionId - Transaction ID
   * @param {string} reason - Lý do hoàn tiền
   */
  async refundTransaction(transactionId, reason) {
    const transaction = await userRepository.findTransactionByTxId(transactionId);
    if (!transaction) {
      throw AppError.notFound('Giao dịch không tồn tại');
    }

    if (transaction.status !== 'success') {
      throw AppError.badRequest('Chỉ có thể hoàn tiền các giao dịch thành công');
    }

    // Cập nhật trạng thái giao dịch
    await userRepository.updateTransaction(transaction._id, {
      status: 'refunded',
      refundReason: reason,
      refundedAt: new Date(),
    });

    // Trừ KCH khỏi user balance
    const User = require('../Models/User.model');
    await User.findByIdAndUpdate(transaction.userId, {
      $inc: { kchBalance: -transaction.amountKch },
    });



    return {
      txId: transaction.txId,
      status: 'refunded',
      reason,
    };
  }

  /**
   * Lấy danh sách giao dịch của user
   * @param {string} userId
   * @param {Object} options - { skip, limit, type, status }
   */
  async getUserTransactions(userId, options = {}) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('Người dùng');

    const { skip = 0, limit = 20, type, status } = options;
    const query = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await userRepository.findTransactions(query, { skip, limit });
    const total = await userRepository.countTransactions(query);

    return {
      transactions,
      total,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
    };
  }

  /**
   * Utility: Format ngày tháng cho VNPay
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Utility: Sắp xếp object theo key
   * @param {Object} obj
   * @returns {Object}
   */
  sortObject(obj) {
    let sorted = {};
    let str = [];
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let key of str) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
    return sorted;
  }
}

module.exports = new VNPayService();
