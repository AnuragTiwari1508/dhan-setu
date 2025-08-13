const axios = require('axios');
const { createHmacSignature } = require('../utils/crypto');

class WebhookService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Send webhook to merchant
  async sendWebhook(webhookUrl, payload, secret, attempt = 1) {
    try {
      if (!webhookUrl) {
        console.log('No webhook URL provided');
        return { success: false, error: 'No webhook URL' };
      }

      // Create signature for webhook verification
      const payloadString = JSON.stringify(payload);
      const signature = createHmacSignature(payloadString, secret || process.env.WEBHOOK_SECRET);

      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-DhanSetu-Signature': signature,
          'X-DhanSetu-Event': payload.event,
          'X-DhanSetu-Delivery': Date.now().toString(),
          'User-Agent': 'DhanSetu-Webhook/1.0'
        },
        timeout: 10000, // 10 seconds timeout
        validateStatus: (status) => status >= 200 && status < 300
      });

      console.log(`Webhook sent successfully to ${webhookUrl}:`, {
        status: response.status,
        attempt,
        event: payload.event
      });

      return { 
        success: true, 
        status: response.status,
        attempt
      };

    } catch (error) {
      console.error(`Webhook delivery failed (attempt ${attempt}):`, {
        url: webhookUrl,
        error: error.message,
        status: error.response?.status
      });

      // Retry if not the last attempt
      if (attempt < this.maxRetries) {
        console.log(`Retrying webhook delivery in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay * attempt);
        return this.sendWebhook(webhookUrl, payload, secret, attempt + 1);
      }

      return { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        attempts: attempt
      };
    }
  }

  // Process webhook for payment events
  async processPaymentWebhook(payment, event = 'payment.completed') {
    try {
      const Merchant = require('../models/Merchant');
      const merchant = await Merchant.findById(payment.merchantId);

      if (!merchant || !merchant.webhookUrl) {
        return { success: false, error: 'No webhook URL configured' };
      }

      const payload = {
        event,
        id: payment.paymentId,
        object: 'payment',
        created: Math.floor(payment.createdAt.getTime() / 1000),
        data: {
          payment: {
            id: payment.paymentId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            network: payment.network,
            description: payment.description,
            customer_address: payment.customerAddress,
            transaction_hash: payment.transactionHash,
            created_at: payment.createdAt.toISOString(),
            paid_at: payment.paidAt?.toISOString(),
            expires_at: payment.expiresAt.toISOString(),
            metadata: payment.metadata
          }
        },
        livemode: process.env.NODE_ENV === 'production'
      };

      const result = await this.sendWebhook(merchant.webhookUrl, payload, merchant.webhookSecret);

      // Update webhook status in payment
      payment.webhookSent = result.success;
      payment.webhookAttempts = result.attempts || 1;
      await payment.save();

      return result;

    } catch (error) {
      console.error('Payment webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process webhook for subscription events
  async processSubscriptionWebhook(subscription, event, additionalData = {}) {
    try {
      const Merchant = require('../models/Merchant');
      const { SubscriptionPlan } = require('../models/Subscription');
      
      const merchant = await Merchant.findById(subscription.merchantId);
      const plan = await SubscriptionPlan.findById(subscription.planId);

      if (!merchant || !merchant.webhookUrl) {
        return { success: false, error: 'No webhook URL configured' };
      }

      const payload = {
        event,
        id: subscription.subscriptionId,
        object: 'subscription',
        created: Math.floor(subscription.createdAt.getTime() / 1000),
        data: {
          subscription: {
            id: subscription.subscriptionId,
            plan_id: plan.planId,
            status: subscription.status,
            subscriber_address: subscription.subscriberAddress,
            current_cycle: subscription.currentCycle,
            next_payment_date: subscription.nextPaymentDate.toISOString(),
            last_payment_date: subscription.lastPaymentDate?.toISOString(),
            total_paid: subscription.totalPaid,
            payment_count: subscription.paymentCount,
            failed_payments: subscription.failedPayments,
            created_at: subscription.createdAt.toISOString(),
            metadata: subscription.metadata
          },
          plan: {
            id: plan.planId,
            name: plan.name,
            amount: plan.amount,
            currency: plan.currency,
            interval: plan.interval,
            interval_type: plan.intervalType
          },
          ...additionalData
        },
        livemode: process.env.NODE_ENV === 'production'
      };

      const result = await this.sendWebhook(merchant.webhookUrl, payload, merchant.webhookSecret);

      // Update webhook status in subscription
      subscription.webhookSent = result.success;
      await subscription.save();

      return result;

    } catch (error) {
      console.error('Subscription webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify incoming webhook signature
  verifyWebhookSignature(payload, signature, secret) {
    const { verifyHmacSignature } = require('../utils/crypto');
    return verifyHmacSignature(payload, signature, secret);
  }

  // Delay utility for retries
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test webhook endpoint
  async testWebhook(webhookUrl, secret) {
    const testPayload = {
      event: 'webhook.test',
      id: 'test_' + Date.now(),
      object: 'test',
      created: Math.floor(Date.now() / 1000),
      data: {
        message: 'This is a test webhook from DhanSetu',
        timestamp: new Date().toISOString()
      },
      livemode: false
    };

    return this.sendWebhook(webhookUrl, testPayload, secret);
  }

  // Get webhook event types
  getEventTypes() {
    return {
      payment: [
        'payment.created',
        'payment.completed',
        'payment.failed',
        'payment.expired'
      ],
      subscription: [
        'subscription.created',
        'subscription.payment_due',
        'subscription.payment_processed',
        'subscription.payment_failed',
        'subscription.cancelled',
        'subscription.expired'
      ],
      merchant: [
        'merchant.updated'
      ],
      system: [
        'webhook.test'
      ]
    };
  }

  // Format webhook payload for specific events
  formatWebhookPayload(eventType, data) {
    const basePayload = {
      event: eventType,
      created: Math.floor(Date.now() / 1000),
      livemode: process.env.NODE_ENV === 'production'
    };

    switch (eventType) {
      case 'payment.created':
      case 'payment.completed':
      case 'payment.failed':
      case 'payment.expired':
        return {
          ...basePayload,
          id: data.paymentId,
          object: 'payment',
          data: { payment: data }
        };

      case 'subscription.created':
      case 'subscription.payment_due':
      case 'subscription.payment_processed':
      case 'subscription.payment_failed':
      case 'subscription.cancelled':
      case 'subscription.expired':
        return {
          ...basePayload,
          id: data.subscriptionId,
          object: 'subscription',
          data: { subscription: data }
        };

      default:
        return {
          ...basePayload,
          id: data.id || 'unknown',
          object: 'unknown',
          data
        };
    }
  }
}

// Export singleton instance
module.exports = new WebhookService();
