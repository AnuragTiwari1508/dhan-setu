// Chain gas price API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';

export async function GET(
  request: NextRequest,
  { params }: { params: { chain: string } }
) {
  try {
    const chain = params.chain;
    const gasPrice = await blockchainService.getGasPrice(chain);

    return NextResponse.json({
      chain,
      gasPrice,
      unit: chain === 'solana' ? 'SOL' : 'gwei'
    });

  } catch (error) {
    console.error('Error fetching gas price:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
