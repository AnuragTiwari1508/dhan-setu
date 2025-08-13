// Wallet signing API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/services/wallet';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const walletId = params.id;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const signature = await walletService.signMessage(walletId, message);

    walletService.updateLastUsed(walletId);

    return NextResponse.json({
      signature,
      message,
      walletId
    });

  } catch (error) {
    console.error('Error signing message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
