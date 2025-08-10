// Subscriptions API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { customerId, planId, walletAddress } = body;
    
    if (!customerId || !planId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, planId, walletAddress' },
        { status: 400 }
      );
    }

    // Validate plan exists
    const plan = subscriptionService.getPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create subscription
    const subscription = await subscriptionService.createSubscription({
      customerId,
      customerEmail: body.customerEmail,
      planId,
      walletAddress,
      trialDays: body.trialDays,
      metadata: body.metadata
    });

    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const customerId = searchParams.get('customerId');

    let subscriptions;
    
    if (customerId) {
      subscriptions = subscriptionService.getCustomerSubscriptions(customerId);
    } else {
      subscriptions = subscriptionService.getAllSubscriptions(status);
    }

    return NextResponse.json({
      subscriptions,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
