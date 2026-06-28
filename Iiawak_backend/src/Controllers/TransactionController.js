'use strict';
const Transaction = require('../Models/Transaction.model');
const User = require('../Models/User.model');
const AppError = require('../Exceptions/AppError');

class TransactionController {

  // Lấy danh sách giao dịch (có thể lọc theo status)
  async getTransactions(req, res) {
    try {
      const { status, type } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const transactions = await Transaction.find(filter)
        .populate('userId', 'username email fullName avatar')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: transactions });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Duyệt giao dịch
  async approveTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findById(id);

      if (!transaction) throw AppError.notFound('Giao dịch');
      if (transaction.status !== 'pending') {
        throw AppError.badRequest('Chỉ có thể duyệt giao dịch ở trạng thái chờ.');
      }

      // Đổi trạng thái và cộng tiền
      transaction.status = 'success';
      await transaction.save();

      // Cộng KCH cho user
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { kchBalance: transaction.amountKch }
      });

      res.json({ success: true, message: 'Đã duyệt giao dịch', data: transaction });
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  // Từ chối giao dịch
  async rejectTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findById(id);

      if (!transaction) throw AppError.notFound('Giao dịch');
      if (transaction.status !== 'pending') {
        throw AppError.badRequest('Chỉ có thể từ chối giao dịch ở trạng thái chờ.');
      }

      transaction.status = 'failed';
      await transaction.save();

      res.json({ success: true, message: 'Đã từ chối giao dịch', data: transaction });
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new TransactionController();
