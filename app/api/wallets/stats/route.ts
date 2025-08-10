// Wallet statistics API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/services/wallet';

export async function GET(request: NextRequest) {
  try {
    const stats = walletService.getWalletStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
