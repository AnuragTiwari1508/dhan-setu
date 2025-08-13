const express = require('express');
const { body, validationResult } = require('express-validator');
const { SubscriptionPlan, Subscription } = require('../models/Subscription');
const { authenticateApiKey } = require('../middleware/auth');
const { generateSubscriptionId } = require('../utils/crypto');
const webhookService = require('../services/webhookService');
const blockchainService = require('../services/blockchainService');
const router = express.Router();

// Create subscription plan
router.post('/plans', [
  authenticateApiKey,
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('amount').isNumeric().custom(value => parseFloat(value) > 0),
  body('currency').isLength({ min: 2, max: 10 }).toUpperCase(),
  body('interval').isNumeric().custom(value => parseInt(value) > 0),
  body('intervalType').isIn(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  body('network').isIn(['ethereum', 'polygon', 'goerli', 'mumbai'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { 
      name, 
      description, 
      amount, 
      currency, 
      interval, 
      intervalType, 
      network, 
      tokenAddress,
      maxCycles,
      trialPeriod,
      setupFee,
      metadata 
    } = req.body;

    const merchantId = req.merchant._id;

    // Generate unique plan ID
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create subscription plan
    const plan = new SubscriptionPlan({
      planId,
      merchantId,
      name,
      description,
      amount: amount.toString(),
      currency: currency.toUpperCase(),
      tokenAddress,
      network,
      interval: parseInt(interval),
      intervalType,
      maxCycles: maxCycles ? parseInt(maxCycles) : null,
      trialPeriod: trialPeriod ? parseInt(trialPeriod) : 0,
      setupFee: setupFee ? setupFee.toString() : '0',
      metadata: metadata || {}
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: {
        plan: {
          id: plan.planId,
          name: plan.name,
          description: plan.description,
          amount: plan.amount,
          currency: plan.currency,
          interval: plan.interval,
          intervalType: plan.intervalType,
          network: plan.network,
          isActive: plan.isActive,
          createdAt: plan.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Plan creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during plan creation' 
    });
  }
});

// Get merchant plans
router.get('/plans', [authenticateApiKey], async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const merchantId = req.merchant._id;

    const query = { merchantId };
    if (status) query.isActive = status === 'active';

    const plans = await SubscriptionPlan.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await SubscriptionPlan.countDocuments(query);

    res.json({
      success: true,
      data: {
        plans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPlans: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get specific plan
router.get('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await SubscriptionPlan.findOne({ planId })
      .populate('merchantId', 'businessName name');

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    res.json({
      success: true,
      data: { plan }
    });

  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Subscribe to plan
router.post('/subscribe', [
  body('planId').exists(),
  body('subscriberAddress').isLength({ min: 40, max: 42 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { planId, subscriberAddress, metadata } = req.body;

    // Find the plan
    const plan = await SubscriptionPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan is not active' 
      });
    }

    // Check if user already has active subscription to this plan
    const existingSubscription = await Subscription.findOne({
      planId: plan._id,
      subscriberAddress,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already subscribed to this plan' 
      });
    }

    // Generate unique subscription ID
    const subscriptionId = generateSubscriptionId();

    // Calculate next payment date
    const nextPaymentDate = new Date();
    if (plan.trialPeriod > 0) {
      nextPaymentDate.setSeconds(nextPaymentDate.getSeconds() + plan.trialPeriod);
    } else {
      nextPaymentDate.setSeconds(nextPaymentDate.getSeconds() + plan.interval);
    }

    // Create subscription
    const subscription = new Subscription({
      subscriptionId,
      planId: plan._id,
      merchantId: plan.merchantId,
      subscriberAddress,
      nextPaymentDate,
      metadata: metadata || {},
      trialEndsAt: plan.trialPeriod > 0 ? 
        new Date(Date.now() + plan.trialPeriod * 1000) : null
    });

    await subscription.save();

    // Update plan subscriber count
    plan.subscriberCount += 1;
    await plan.save();

    // Send webhook
    await webhookService.processSubscriptionWebhook(subscription, 'subscription.created');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: {
          id: subscription.subscriptionId,
          planId: plan.planId,
          status: subscription.status,
          nextPaymentDate: subscription.nextPaymentDate,
          trialEndsAt: subscription.trialEndsAt,
          createdAt: subscription.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during subscription' 
    });
  }
});

// Get subscription details
router.get('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findOne({ subscriptionId })
      .populate('planId')
      .populate('merchantId', 'businessName name');

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }

    res.json({
      success: true,
      data: { subscription }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Cancel subscription
router.post('/:subscriptionId/cancel', [
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription is not active' 
      });
    }

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    if (reason) {
      subscription.metadata.cancellationReason = reason;
    }
    await subscription.save();

    // Update plan subscriber count
    const plan = await SubscriptionPlan.findById(subscription.planId);
    if (plan) {
      plan.subscriberCount = Math.max(0, plan.subscriberCount - 1);
      await plan.save();
    }

    // Send webhook
    await webhookService.processSubscriptionWebhook(
      subscription, 
      'subscription.cancelled',
      { cancellation_reason: reason }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: {
          id: subscription.subscriptionId,
          status: subscription.status,
          cancelledAt: subscription.cancelledAt
        }
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during cancellation' 
    });
  }
});

// Get merchant subscriptions
router.get('/merchant/:merchantId', [authenticateApiKey], async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { page = 1, limit = 20, status, planId } = req.query;

    // Verify merchant access
    if (req.merchant._id.toString() !== merchantId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const query = { merchantId: req.merchant._id };
    if (status) query.status = status;
    if (planId) {
      const plan = await SubscriptionPlan.findOne({ planId });
      if (plan) query.planId = plan._id;
    }

    const subscriptions = await Subscription.find(query)
      .populate('planId', 'planId name amount currency intervalType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSubscriptions: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Merchant subscriptions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get subscription statistics
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

    const stats = await Subscription.aggregate([
      { $match: { merchantId: req.merchant._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: '$totalPaid' } }
        }
      }
    ]);

    const totalSubscriptions = await Subscription.countDocuments({ 
      merchantId: req.merchant._id 
    });

    const activeSubscriptions = await Subscription.countDocuments({ 
      merchantId: req.merchant._id, 
      status: 'active' 
    });

    const totalPlans = await SubscriptionPlan.countDocuments({ 
      merchantId: req.merchant._id 
    });

    res.json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        totalPlans,
        statusBreakdown: stats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Subscription stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
