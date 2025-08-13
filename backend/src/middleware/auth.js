const jwt = require('jsonwebtoken');
const Merchant = require('../models/Merchant');

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find merchant and attach to request
    const merchant = await Merchant.findById(decoded.merchantId).select('-password');
    if (!merchant) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    if (!merchant.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    req.merchant = merchant;
    req.merchantId = merchant._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// API Key Authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        message: 'API key required' 
      });
    }

    // Find merchant by API key
    const merchant = await Merchant.findOne({ apiKey }).select('-password');
    if (!merchant) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid API key' 
      });
    }

    if (!merchant.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    req.merchant = merchant;
    req.merchantId = merchant._id;
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Optional authentication (for public endpoints that benefit from auth context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-api-key'];
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const merchant = await Merchant.findById(decoded.merchantId).select('-password');
          if (merchant && merchant.isActive) {
            req.merchant = merchant;
            req.merchantId = merchant._id;
          }
        } catch (error) {
          // Ignore token errors for optional auth
        }
      }
    } else if (apiKey) {
      try {
        const merchant = await Merchant.findOne({ apiKey }).select('-password');
        if (merchant && merchant.isActive) {
          req.merchant = merchant;
          req.merchantId = merchant._id;
        }
      } catch (error) {
        // Ignore API key errors for optional auth
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, continue even if there's an error
    next();
  }
};

// Admin authentication (for admin endpoints)
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is an admin token (you might have a separate admin model)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin token expired' 
      });
    }
    
    console.error('Admin authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

module.exports = {
  authenticateToken,
  authenticateApiKey,
  optionalAuth,
  authenticateAdmin
};
