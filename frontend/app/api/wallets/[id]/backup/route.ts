// Wallet backup API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/services/wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const walletId = params.id;
    const backup = await walletService.backupWallet(walletId);

    return NextResponse.json(backup);

  } catch (error) {
    console.error('Error backing up wallet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
