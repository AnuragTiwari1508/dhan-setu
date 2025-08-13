// Subscription payments API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;
    const payments = subscriptionService.getSubscriptionPayments(subscriptionId);

    return NextResponse.json({
      payments,
      total: payments.length
    });

  } catch (error) {
    console.error('Error fetching subscription payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
