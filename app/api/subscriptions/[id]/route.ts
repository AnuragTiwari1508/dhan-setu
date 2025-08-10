// Individual subscription API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;
    const subscription = subscriptionService.getSubscription(subscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;
    const body = await request.json();
    const { action, ...data } = body;

    let subscription;

    switch (action) {
      case 'cancel':
        subscription = subscriptionService.cancelSubscription(
          subscriptionId, 
          data.cancelAtPeriodEnd !== false
        );
        break;
      
      case 'pause':
        subscription = subscriptionService.pauseSubscription(subscriptionId);
        break;
      
      case 'resume':
        subscription = subscriptionService.resumeSubscription(subscriptionId);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: cancel, pause, resume' },
          { status: 400 }
        );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or action failed' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
