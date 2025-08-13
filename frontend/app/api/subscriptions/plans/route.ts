// Subscription plans API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, amount, currency, network, interval } = body;
    
    if (!name || !amount || !currency || !network || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: name, amount, currency, network, interval' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate interval
    const validIntervals = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be one of: ' + validIntervals.join(', ') },
        { status: 400 }
      );
    }

    // Create subscription plan
    const plan = subscriptionService.createPlan({
      name,
      description: body.description,
      amount,
      currency,
      network,
      interval,
      intervalCount: body.intervalCount || 1,
      trialDays: body.trialDays,
      maxBillingCycles: body.maxBillingCycles,
      setupFee: body.setupFee,
      metadata: body.metadata
    });

    return NextResponse.json(plan);

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const plans = subscriptionService.getAllPlans();

    return NextResponse.json({
      plans,
      total: plans.length
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
