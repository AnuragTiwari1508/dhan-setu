// Subscription service inspired by Spheron subscription contracts and BitDiem Recur
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { paymentService } from './payment';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  amount: string;
  currency: string;
  network: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number; // e.g., 2 for "every 2 months"
  trialDays?: number;
  maxBillingCycles?: number; // null for unlimited
  setupFee?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerEmail?: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  endedAt?: Date;
  billingCycleCount: number;
  totalPaid: string;
  lastPaymentDate?: Date;
  nextBillingDate: Date;
  failedPaymentAttempts: number;
  walletAddress: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: string;
  currency: string;
  network: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDate: Date;
  paidAt?: Date;
  transactionHash?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  attemptCount: number;
  failureReason?: string;
  metadata?: Record<string, any>;
}

// In-memory storage (replace with database in production)
const subscriptionPlans = new Map<string, SubscriptionPlan>();
const subscriptions = new Map<string, Subscription>();
const subscriptionPayments = new Map<string, SubscriptionPayment>();

export class SubscriptionService {
  private cronJobs = new Map<string, any>();

  constructor() {
    this.initializeCronJobs();
  }

  // Initialize cron jobs for payment processing
  private initializeCronJobs(): void {
    // Run billing process every hour
    cron.schedule('0 * * * *', () => {
      this.processDueBillings();
    });

    // Cleanup expired trials daily
    cron.schedule('0 0 * * *', () => {
      this.processTrialExpirations();
    });
  }

  // Plan Management (inspired by Spheron's SubscriptionData contract)
  
  createPlan(planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): SubscriptionPlan {
    const plan: SubscriptionPlan = {
      id: `plan_${uuidv4()}`,
      ...planData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    subscriptionPlans.set(plan.id, plan);
    return plan;
  }

  getPlan(planId: string): SubscriptionPlan | null {
    return subscriptionPlans.get(planId) || null;
  }

  getAllPlans(): SubscriptionPlan[] {
    return Array.from(subscriptionPlans.values());
  }

  updatePlan(planId: string, updates: Partial<SubscriptionPlan>): SubscriptionPlan | null {
    const plan = subscriptionPlans.get(planId);
    if (!plan) return null;

    const updatedPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date()
    };

    subscriptionPlans.set(planId, updatedPlan);
    return updatedPlan;
  }

  deletePlan(planId: string): boolean {
    // Check if plan has active subscriptions
    const activeSubscriptions = Array.from(subscriptions.values())
      .filter(sub => sub.planId === planId && sub.status === 'active');

    if (activeSubscriptions.length > 0) {
      throw new Error('Cannot delete plan with active subscriptions');
    }

    return subscriptionPlans.delete(planId);
  }

  // Subscription Management (inspired by BitDiem Recur's recurring payment logic)

  async createSubscription(subscriptionData: {
    customerId: string;
    customerEmail?: string;
    planId: string;
    walletAddress: string;
    trialDays?: number;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    const plan = this.getPlan(subscriptionData.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const trialDays = subscriptionData.trialDays ?? plan.trialDays ?? 0;
    const isTrialing = trialDays > 0;

    let currentPeriodStart = now;
    let currentPeriodEnd = this.calculateNextBillingDate(now, plan.interval, plan.intervalCount);
    let nextBillingDate = currentPeriodEnd;
    let trialStart: Date | undefined;
    let trialEnd: Date | undefined;

    if (isTrialing) {
      trialStart = now;
      trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      nextBillingDate = trialEnd;
    }

    const subscription: Subscription = {
      id: `sub_${uuidv4()}`,
      customerId: subscriptionData.customerId,
      customerEmail: subscriptionData.customerEmail,
      planId: subscriptionData.planId,
      status: isTrialing ? 'trialing' : 'active',
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      billingCycleCount: 0,
      totalPaid: '0',
      nextBillingDate,
      failedPaymentAttempts: 0,
      walletAddress: subscriptionData.walletAddress,
      metadata: subscriptionData.metadata,
      createdAt: now,
      updatedAt: now
    };

    subscriptions.set(subscription.id, subscription);

    // Create setup fee payment if applicable
    if (plan.setupFee && parseFloat(plan.setupFee) > 0) {
      await this.createSubscriptionPayment(subscription.id, plan.setupFee, 'Setup Fee');
    }

    return subscription;
  }

  getSubscription(subscriptionId: string): Subscription | null {
    return subscriptions.get(subscriptionId) || null;
  }

  getCustomerSubscriptions(customerId: string): Subscription[] {
    return Array.from(subscriptions.values())
      .filter(sub => sub.customerId === customerId);
  }

  getAllSubscriptions(status?: Subscription['status']): Subscription[] {
    const allSubs = Array.from(subscriptions.values());
    return status ? allSubs.filter(sub => sub.status === status) : allSubs;
  }

  // Cancel subscription (inspired by BitDiem Recur's cancel functionality)
  cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Subscription | null {
    const subscription = subscriptions.get(subscriptionId);
    if (!subscription) return null;

    const now = new Date();

    if (cancelAtPeriodEnd) {
      // Cancel at the end of current billing period
      subscription.canceledAt = now;
      subscription.endedAt = subscription.currentPeriodEnd;
    } else {
      // Cancel immediately
      subscription.status = 'canceled';
      subscription.canceledAt = now;
      subscription.endedAt = now;
    }

    subscription.updatedAt = now;
    subscriptions.set(subscriptionId, subscription);

    return subscription;
  }

  // Pause/Resume subscription
  pauseSubscription(subscriptionId: string): Subscription | null {
    const subscription = subscriptions.get(subscriptionId);
    if (!subscription || subscription.status !== 'active') return null;

    subscription.status = 'paused';
    subscription.updatedAt = new Date();
    subscriptions.set(subscriptionId, subscription);

    return subscription;
  }

  resumeSubscription(subscriptionId: string): Subscription | null {
    const subscription = subscriptions.get(subscriptionId);
    if (!subscription || subscription.status !== 'paused') return null;

    subscription.status = 'active';
    subscription.updatedAt = new Date();
    subscriptions.set(subscriptionId, subscription);

    return subscription;
  }

  // Payment Processing (inspired by Spheron's chargeUser function)

  private async createSubscriptionPayment(
    subscriptionId: string, 
    amount: string, 
    description = 'Subscription payment'
  ): Promise<SubscriptionPayment> {
    const subscription = subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const plan = this.getPlan(subscription.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const subscriptionPayment: SubscriptionPayment = {
      id: `subpay_${uuidv4()}`,
      subscriptionId,
      amount,
      currency: plan.currency,
      network: plan.network,
      status: 'pending',
      paymentDate: new Date(),
      billingPeriodStart: subscription.currentPeriodStart,
      billingPeriodEnd: subscription.currentPeriodEnd,
      attemptCount: 1,
      metadata: { description }
    };

    subscriptionPayments.set(subscriptionPayment.id, subscriptionPayment);

    try {
      // Create payment using payment service
      const payment = await paymentService.createPayment({
        amount,
        currency: plan.currency,
        network: plan.network,
        description: `${description} - Subscription ${subscriptionId}`,
        customerEmail: subscription.customerEmail,
        metadata: {
          subscriptionId,
          subscriptionPaymentId: subscriptionPayment.id,
          type: 'subscription'
        }
      });

      subscriptionPayment.metadata = {
        ...subscriptionPayment.metadata,
        paymentId: payment.id
      };

      subscriptionPayments.set(subscriptionPayment.id, subscriptionPayment);

      return subscriptionPayment;
    } catch (error) {
      subscriptionPayment.status = 'failed';
      subscriptionPayment.failureReason = error instanceof Error ? error.message : 'Unknown error';
      subscriptionPayments.set(subscriptionPayment.id, subscriptionPayment);
      throw error;
    }
  }

  // Process due billings (runs via cron)
  private async processDueBillings(): Promise<void> {
    const now = new Date();
    const dueSubscriptions = Array.from(subscriptions.values())
      .filter(sub => 
        (sub.status === 'active' || sub.status === 'trialing') &&
        sub.nextBillingDate <= now
      );

    for (const subscription of dueSubscriptions) {
      try {
        await this.processBilling(subscription);
      } catch (error) {
        console.error(`Error processing billing for subscription ${subscription.id}:`, error);
      }
    }
  }

  private async processBilling(subscription: Subscription): Promise<void> {
    const plan = this.getPlan(subscription.planId);
    if (!plan) return;

    try {
      // Create subscription payment
      await this.createSubscriptionPayment(subscription.id, plan.amount);

      // Update subscription billing cycle
      subscription.billingCycleCount += 1;
      subscription.currentPeriodStart = subscription.currentPeriodEnd;
      subscription.currentPeriodEnd = this.calculateNextBillingDate(
        subscription.currentPeriodEnd,
        plan.interval,
        plan.intervalCount
      );
      subscription.nextBillingDate = subscription.currentPeriodEnd;
      subscription.status = 'active';
      subscription.updatedAt = new Date();

      // Check if subscription should end (max billing cycles reached)
      if (plan.maxBillingCycles && subscription.billingCycleCount >= plan.maxBillingCycles) {
        subscription.status = 'canceled';
        subscription.endedAt = new Date();
      }

      subscriptions.set(subscription.id, subscription);

    } catch (error) {
      // Handle failed payment
      subscription.failedPaymentAttempts += 1;
      
      if (subscription.failedPaymentAttempts >= 3) {
        subscription.status = 'unpaid';
      } else {
        subscription.status = 'past_due';
        // Retry in 3 days
        subscription.nextBillingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      }

      subscription.updatedAt = new Date();
      subscriptions.set(subscription.id, subscription);
    }
  }

  // Process trial expirations
  private processTrialExpirations(): void {
    const now = new Date();
    const expiredTrials = Array.from(subscriptions.values())
      .filter(sub => 
        sub.status === 'trialing' &&
        sub.trialEnd &&
        sub.trialEnd <= now
      );

    for (const subscription of expiredTrials) {
      subscription.status = 'active';
      subscription.nextBillingDate = subscription.trialEnd!;
      subscription.updatedAt = now;
      subscriptions.set(subscription.id, subscription);
    }
  }

  // Utility methods

  private calculateNextBillingDate(fromDate: Date, interval: string, intervalCount: number): Date {
    const date = new Date(fromDate);

    switch (interval) {
      case 'daily':
        date.setDate(date.getDate() + intervalCount);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (intervalCount * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + intervalCount);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + (intervalCount * 3));
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + intervalCount);
        break;
    }

    return date;
  }

  // Get subscription analytics
  getSubscriptionStats(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    canceledSubscriptions: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
  } {
    const allSubs = Array.from(subscriptions.values());
    const activeSubs = allSubs.filter(sub => sub.status === 'active');
    
    // Calculate MRR (simplified - assumes monthly billing)
    const mrr = activeSubs.reduce((sum, sub) => {
      const plan = this.getPlan(sub.planId);
      if (plan && plan.interval === 'monthly') {
        return sum + parseFloat(plan.amount);
      }
      return sum;
    }, 0);

    return {
      totalSubscriptions: allSubs.length,
      activeSubscriptions: activeSubs.length,
      trialingSubscriptions: allSubs.filter(sub => sub.status === 'trialing').length,
      canceledSubscriptions: allSubs.filter(sub => sub.status === 'canceled').length,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: mrr * 12
    };
  }

  // Get subscription payments
  getSubscriptionPayments(subscriptionId: string): SubscriptionPayment[] {
    return Array.from(subscriptionPayments.values())
      .filter(payment => payment.subscriptionId === subscriptionId)
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }

  // Update subscription payment status
  updateSubscriptionPaymentStatus(
    paymentId: string, 
    status: SubscriptionPayment['status'], 
    transactionHash?: string
  ): boolean {
    const payment = Array.from(subscriptionPayments.values())
      .find(p => p.metadata?.paymentId === paymentId);
    
    if (!payment) return false;

    payment.status = status;
    if (transactionHash) {
      payment.transactionHash = transactionHash;
    }
    if (status === 'paid') {
      payment.paidAt = new Date();
      
      // Update subscription
      const subscription = subscriptions.get(payment.subscriptionId);
      if (subscription) {
        subscription.totalPaid = (parseFloat(subscription.totalPaid) + parseFloat(payment.amount)).toString();
        subscription.lastPaymentDate = new Date();
        subscription.failedPaymentAttempts = 0; // Reset failed attempts
        subscriptions.set(subscription.id, subscription);
      }
    }

    subscriptionPayments.set(payment.id, payment);
    return true;
  }
}

// Singleton instance
export const subscriptionService = new SubscriptionService();
