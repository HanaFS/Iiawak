'use strict';
const express = require('express');
const router = express.Router();
const transactionController = require('../Controllers/TransactionController');
const { verifyToken, adminOnly } = require('../Middlewares/auth.middleware');

// Chỉ dành cho Admin
router.use(verifyToken, adminOnly);

router.get('/', transactionController.getTransactions);
router.post('/:id/approve', transactionController.approveTransaction);
router.post('/:id/reject', transactionController.rejectTransaction);

module.exports = router;
