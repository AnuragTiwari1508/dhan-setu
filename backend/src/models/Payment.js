const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  amount: {
    type: String, // Using string to handle large numbers
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  tokenAddress: {
    type: String,
    default: null // null for native tokens like ETH
  },
  network: {
    type: String,
    required: true,
    enum: ['ethereum', 'polygon', 'goerli', 'mumbai']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired'],
    default: 'pending'
  },
  customerAddress: {
    type: String,
    default: null
  },
  transactionHash: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhookSent: {
    type: Boolean,
    default: false
  },
  webhookAttempts: {
    type: Number,
    default: 0
  },
  qrCode: {
    type: String, // Base64 encoded QR code
    default: null
  },
  paymentUrl: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  paidAt: {
    type: Date,
    default: null
  },
  fee: {
    amount: { type: String, default: '0' },
    percentage: { type: Number, default: 2.5 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
paymentSchema.index({ merchantId: 1, status: 1 });
paymentSchema.index({ transactionHash: 1 });
paymentSchema.index({ expiresAt: 1 });

// Update updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for payment URL
paymentSchema.virtual('fullPaymentUrl').get(function() {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pay/${this.paymentId}`;
});

module.exports = mongoose.model('Payment', paymentSchema);
