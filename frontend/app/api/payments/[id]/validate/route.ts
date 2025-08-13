// Payment validation API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const body = await request.json();
    const { transactionHash } = body;

    if (!transactionHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    const isValid = await paymentService.validatePayment(paymentId, transactionHash);

    if (isValid) {
      const payment = paymentService.getPayment(paymentId);
      return NextResponse.json({
        valid: true,
        payment
      });
    } else {
      return NextResponse.json({
        valid: false,
        message: 'Payment validation failed'
      });
    }

  } catch (error) {
    console.error('Error validating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
