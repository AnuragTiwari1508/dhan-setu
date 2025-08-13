// Payment statistics API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment';

export async function GET(request: NextRequest) {
  try {
    const stats = paymentService.getPaymentStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
