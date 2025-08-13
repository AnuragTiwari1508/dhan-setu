const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const merchantSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  apiKey: {
    type: String,
    unique: true,
    required: true
  },
  webhookUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    acceptedTokens: [{
      symbol: String,
      address: String,
      decimals: Number,
      network: String
    }],
    defaultCurrency: {
      type: String,
      default: 'ETH'
    },
    notifications: {
      email: { type: Boolean, default: true },
      webhook: { type: Boolean, default: false }
    }
  },
  walletAddress: {
    type: String,
    required: true
  },
  totalVolume: {
    type: Number,
    default: 0
  },
  totalFees: {
    type: Number,
    default: 0
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

// Hash password before saving
merchantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt field before saving
merchantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
merchantSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate API key
merchantSchema.methods.generateApiKey = function() {
  const crypto = require('crypto');
  this.apiKey = `ds_${crypto.randomBytes(32).toString('hex')}`;
  return this.apiKey;
};

module.exports = mongoose.model('Merchant', merchantSchema);
