require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple API
app.get('/api', (req, res) => {
  res.json({
    name: 'DhanSetu Payment Gateway API',
    version: '1.0.0',
    description: 'Self-hosted crypto payment gateway with multi-chain support',
    endpoints: {
      auth: '/api/auth',
      payments: '/api/payments',
      subscriptions: '/api/subscriptions',
      wallets: '/api/wallets',
      chains: '/api/chains',
      webhooks: '/api/webhooks'
    },
    documentation: '/api/docs'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DhanSetu Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
