// Individual wallet API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/services/wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const walletId = params.id;
    const wallet = walletService.getWallet(walletId);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    walletService.updateLastUsed(walletId);

    return NextResponse.json(wallet);

  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const walletId = params.id;
    const deleted = walletService.removeWallet(walletId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Wallet deleted successfully' });

  } catch (error) {
    console.error('Error deleting wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
