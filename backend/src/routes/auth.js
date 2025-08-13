
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Merchant = require('../models/Merchant');
const { generateApiKey } = require('../utils/crypto');
const router = express.Router();

// Google OAuth
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
// Google OAuth login
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    let merchant = await Merchant.findOne({ email: payload.email });
    if (!merchant) {
      // Register new merchant
      merchant = new Merchant({
        email: payload.email,
        password: Math.random().toString(36),
        name: payload.name || payload.email,
        businessName: payload.email.split('@')[0],
        walletAddress: '',
        apiKey: generateApiKey()
      });
      await merchant.save();
    }
    const token = jwt.sign({ merchantId: merchant._id, email: merchant.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        merchant: {
          id: merchant._id,
          email: merchant.email,
          name: merchant.name,
          businessName: merchant.businessName,
          apiKey: merchant.apiKey,
          walletAddress: merchant.walletAddress
        },
        token
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Google authentication failed', details: err.message });
  }
});

// Register merchant
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('businessName').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, name, businessName, website } = req.body;

    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({ 
        success: false, 
        message: 'Merchant already exists with this email' 
      });
    }

    // Generate wallet address (simplified for demo)
    const crypto = require('crypto');
    const walletAddress = '0x' + crypto.randomBytes(20).toString('hex');

    // Create new merchant
    const merchant = new Merchant({
      email,
      password,
      name,
      businessName,
      website,
      walletAddress,
      apiKey: generateApiKey()
    });

    await merchant.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        merchantId: merchant._id,
        email: merchant.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Merchant registered successfully',
      data: {
        merchant: {
          id: merchant._id,
          email: merchant.email,
          name: merchant.name,
          businessName: merchant.businessName,
          apiKey: merchant.apiKey,
          walletAddress: merchant.walletAddress
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Login merchant
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find merchant
    const merchant = await Merchant.findOne({ email });
    if (!merchant) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await merchant.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (!merchant.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        merchantId: merchant._id,
        email: merchant.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        merchant: {
          id: merchant._id,
          email: merchant.email,
          name: merchant.name,
          businessName: merchant.businessName,
          apiKey: merchant.apiKey,
          walletAddress: merchant.walletAddress,
          settings: merchant.settings
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Get merchant profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const merchant = await Merchant.findById(decoded.merchantId).select('-password');

    if (!merchant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Merchant not found' 
      });
    }

    res.json({
      success: true,
      data: { merchant }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update merchant profile
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('businessName').optional().trim().isLength({ min: 2 }),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const merchant = await Merchant.findById(decoded.merchantId);

    if (!merchant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Merchant not found' 
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'businessName', 'website', 'webhookUrl'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        merchant[field] = req.body[field];
      }
    });

    await merchant.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        merchant: {
          id: merchant._id,
          email: merchant.email,
          name: merchant.name,
          businessName: merchant.businessName,
          website: merchant.website,
          webhookUrl: merchant.webhookUrl
        }
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Regenerate API key
router.post('/regenerate-api-key', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const merchant = await Merchant.findById(decoded.merchantId);

    if (!merchant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Merchant not found' 
      });
    }

    // Generate new API key
    merchant.generateApiKey();
    await merchant.save();

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: {
        apiKey: merchant.apiKey
      }
    });

  } catch (error) {
    console.error('API key regeneration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
