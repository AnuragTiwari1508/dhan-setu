const express = require('express');
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Merchant = require('../models/Merchant');
const { authenticateApiKey } = require('../middleware/auth');
const { generatePaymentId } = require('../utils/crypto');
const { processWebhook } = require('../services/webhookService');
const blockchainService = require('../services/blockchainService');
const router = express.Router();

// Create payment
router.post('/create', [
  authenticateApiKey,
  body('amount').isNumeric().custom(value => parseFloat(value) > 0),
  body('currency').isLength({ min: 2, max: 10 }).toUpperCase(),
  body('network').isIn(['ethereum', 'polygon', 'goerli', 'mumbai']),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { amount, currency, network, description, metadata, tokenAddress } = req.body;
    const merchantId = req.merchant._id;

    // Generate unique payment ID
    const paymentId = generatePaymentId();

    // Create payment URL
    const paymentUrl = `${process.env.FRONTEND_URL}/pay/${paymentId}`;

    // Generate QR code for payment
    const qrCodeData = await QRCode.toDataURL(paymentUrl);

    // Create payment record
    const payment = new Payment({
      paymentId,
      merchantId,
      amount: amount.toString(),
      currency: currency.toUpperCase(),
      tokenAddress,
      network,
      description,
      metadata: metadata || {},
      paymentUrl,
      qrCode: qrCodeData
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        paymentId,
        paymentUrl,
        qrCode: qrCodeData,
        amount,
        currency,
        network,
        status: 'pending',
        expiresAt: payment.expiresAt
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during payment creation' 
    });
  }
});

// Get payment status
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ paymentId })
      .populate('merchantId', 'businessName');

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Check if payment has expired
    if (payment.status === 'pending' && new Date() > payment.expiresAt) {
      payment.status = 'expired';
      await payment.save();
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        merchantName: payment.merchantId.businessName,
        amount: payment.amount,
        currency: payment.currency,
        network: payment.network,
        status: payment.status,
        description: payment.description,
        customerAddress: payment.customerAddress,
        transactionHash: payment.transactionHash,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt
      }
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Complete payment (called by frontend after blockchain transaction)
router.post('/complete', [
  body('paymentId').exists(),
  body('transactionHash').isLength({ min: 64, max: 66 }),
  body('customerAddress').isLength({ min: 40, max: 42 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { paymentId, transactionHash, customerAddress } = req.body;

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment is not in pending status' 
      });
    }

    // Verify transaction on blockchain
    const isValid = await blockchainService.verifyTransaction(
      transactionHash,
      payment.network,
      payment.amount,
      payment.tokenAddress
    );

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction verification failed' 
      });
    }

    // Update payment status
    payment.status = 'completed';
    payment.customerAddress = customerAddress;
    payment.transactionHash = transactionHash;
    payment.paidAt = new Date();
    await payment.save();

    // Update merchant total volume
    const merchant = await Merchant.findById(payment.merchantId);
    if (merchant) {
      merchant.totalVolume += parseFloat(payment.amount);
      await merchant.save();
    }

    // Send webhook notification
    if (merchant.webhookUrl) {
      await processWebhook(merchant.webhookUrl, {
        event: 'payment.completed',
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        transactionHash,
        customerAddress,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        paymentId: payment.paymentId,
        status: payment.status,
        transactionHash,
        paidAt: payment.paidAt
      }
    });

  } catch (error) {
    console.error('Payment completion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during payment completion' 
    });
  }
});

// Get merchant payments
router.get('/merchant/:merchantId', [authenticateApiKey], async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { page = 1, limit = 20, status, network } = req.query;

    // Verify merchant access
    if (req.merchant._id.toString() !== merchantId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Build query
    const query = { merchantId };
    if (status) query.status = status;
    if (network) query.network = network;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Merchant payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get payment statistics
router.get('/stats/:merchantId', [authenticateApiKey], async (req, res) => {
  try {
    const { merchantId } = req.params;

    // Verify merchant access
    if (req.merchant._id.toString() !== merchantId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const stats = await Payment.aggregate([
      { $match: { merchantId: req.merchant._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments({ merchantId: req.merchant._id });
    const completedPayments = await Payment.countDocuments({ 
      merchantId: req.merchant._id, 
      status: 'completed' 
    });

    const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalPayments,
        completedPayments,
        successRate: successRate.toFixed(2),
        statusBreakdown: stats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Fiat to crypto conversion (RazorPay integration)
router.post('/fiat-to-crypto', [
  body('amount').isNumeric().custom(value => parseFloat(value) > 0),
  body('currency').isIn(['INR', 'USD', 'EUR']),
  body('targetCrypto').isIn(['ETH', 'MATIC', 'USDT', 'USDC'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { amount, currency, targetCrypto } = req.body;

    // Initialize RazorPay
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create RazorPay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // RazorPay expects amount in paise
      currency: currency,
      receipt: `fiat_${Date.now()}`,
      notes: {
        targetCrypto,
        conversionType: 'fiat-to-crypto'
      }
    });

    res.json({
      success: true,
      message: 'Fiat payment order created',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        targetCrypto,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Fiat to crypto error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during fiat conversion' 
    });
  }
});

module.exports = router;
