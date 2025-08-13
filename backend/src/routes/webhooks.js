const express = require('express');
const crypto = require('crypto');
const webhookService = require('../services/webhookService');
const { authenticateApiKey } = require('../middleware/auth');
const router = express.Router();

// Test webhook endpoint
router.post('/test', [authenticateApiKey], async (req, res) => {
  try {
    const { webhookUrl, secret } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Webhook URL is required' 
      });
    }

    const result = await webhookService.testWebhook(
      webhookUrl, 
      secret || process.env.WEBHOOK_SECRET
    );

    res.json({
      success: result.success,
      message: result.success ? 'Webhook test successful' : 'Webhook test failed',
      data: result
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during webhook test' 
    });
  }
});

// Receive webhook from external services (RazorPay, etc.)
router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    // Verify RazorPay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }

    const { event, payload: eventPayload } = req.body;

    console.log('RazorPay webhook received:', { event, payload: eventPayload });

    // Process different RazorPay events
    switch (event) {
      case 'payment.captured':
        await handleRazorPayPaymentCapture(eventPayload.payment.entity);
        break;
      case 'payment.failed':
        await handleRazorPayPaymentFailed(eventPayload.payment.entity);
        break;
      case 'order.paid':
        await handleRazorPayOrderPaid(eventPayload.order.entity);
        break;
      default:
        console.log('Unhandled RazorPay event:', event);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('RazorPay webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Webhook processing error' 
    });
  }
});

// Get webhook event types
router.get('/events', (req, res) => {
  try {
    const eventTypes = webhookService.getEventTypes();

    res.json({
      success: true,
      data: { eventTypes }
    });

  } catch (error) {
    console.error('Get webhook events error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Resend webhook for a specific payment
router.post('/resend/:paymentId', [authenticateApiKey], async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { event = 'payment.completed' } = req.body;

    const Payment = require('../models/Payment');
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Verify merchant owns this payment
    if (payment.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const result = await webhookService.processPaymentWebhook(payment, event);

    res.json({
      success: result.success,
      message: result.success ? 'Webhook resent successfully' : 'Webhook resend failed',
      data: result
    });

  } catch (error) {
    console.error('Webhook resend error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during webhook resend' 
    });
  }
});

// Webhook delivery logs (placeholder)
router.get('/logs/:merchantId', [authenticateApiKey], async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify merchant access
    if (req.merchant._id.toString() !== merchantId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // This would typically come from a webhook logs collection
    const logs = [
      {
        id: 'wh_log_1',
        event: 'payment.completed',
        paymentId: 'pay_123',
        url: req.merchant.webhookUrl,
        status: 'success',
        attempts: 1,
        responseStatus: 200,
        responseTime: 250,
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalLogs: logs.length
        }
      }
    });

  } catch (error) {
    console.error('Webhook logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Helper functions for RazorPay webhook processing
async function handleRazorPayPaymentCapture(payment) {
  try {
    console.log('Processing RazorPay payment capture:', payment);
    
    // Find related payment or subscription in your database
    // Update status and trigger your own webhooks
    
    // This is where you'd convert fiat to crypto if needed
    
  } catch (error) {
    console.error('RazorPay payment capture error:', error);
  }
}

async function handleRazorPayPaymentFailed(payment) {
  try {
    console.log('Processing RazorPay payment failure:', payment);
    
    // Handle failed payment
    
  } catch (error) {
    console.error('RazorPay payment failure error:', error);
  }
}

async function handleRazorPayOrderPaid(order) {
  try {
    console.log('Processing RazorPay order paid:', order);
    
    // Handle completed order
    
  } catch (error) {
    console.error('RazorPay order paid error:', error);
  }
}

module.exports = router;
