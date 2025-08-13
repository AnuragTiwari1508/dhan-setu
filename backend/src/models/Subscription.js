const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  planId: {
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
    default: null
  },
  network: {
    type: String,
    required: true,
    enum: ['ethereum', 'polygon', 'goerli', 'mumbai']
  },
  interval: {
    type: Number, // in seconds
    required: true
  },
  intervalType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  maxCycles: {
    type: Number,
    default: null // null for unlimited
  },
  isActive: {
    type: Boolean,
    default: true
  },
  contractPlanId: {
    type: Number, // Plan ID in smart contract
    default: null
  },
  trialPeriod: {
    type: Number, // in seconds
    default: 0
  },
  setupFee: {
    type: String,
    default: '0'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  subscriberCount: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: String,
    default: '0'
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

const subscriptionSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  subscriberAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active'
  },
  contractSubscriptionId: {
    type: Number, // Subscription ID in smart contract
    default: null
  },
  currentCycle: {
    type: Number,
    default: 1
  },
  nextPaymentDate: {
    type: Date,
    required: true
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  totalPaid: {
    type: String,
    default: '0'
  },
  paymentCount: {
    type: Number,
    default: 0
  },
  failedPayments: {
    type: Number,
    default: 0
  },
  trialEndsAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhookSent: {
    type: Boolean,
    default: false
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

// Indexes
subscriptionPlanSchema.index({ merchantId: 1, isActive: 1 });

subscriptionSchema.index({ merchantId: 1, status: 1 });
subscriptionSchema.index({ subscriberAddress: 1 });
subscriptionSchema.index({ nextPaymentDate: 1, status: 1 });

// Update updatedAt field before saving
subscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = {
  SubscriptionPlan,
  Subscription
};
