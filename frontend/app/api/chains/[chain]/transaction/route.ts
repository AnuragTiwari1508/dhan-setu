// Chain transaction status API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';

export async function GET(
  request: NextRequest,
  { params }: { params: { chain: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');

    if (!txHash) {
      return NextResponse.json(
        { error: 'txHash parameter is required' },
        { status: 400 }
      );
    }

    const chain = params.chain;
    const status = await blockchainService.getTransactionStatus(chain, txHash);

    return NextResponse.json({
      chain,
      txHash,
      ...status
    });

  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
