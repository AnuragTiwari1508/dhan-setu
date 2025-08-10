// Subscription statistics API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription';

export async function GET(request: NextRequest) {
  try {
    const stats = subscriptionService.getSubscriptionStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
