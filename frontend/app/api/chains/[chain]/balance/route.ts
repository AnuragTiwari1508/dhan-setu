// Individual chain balance API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';

export async function GET(
  request: NextRequest,
  { params }: { params: { chain: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const tokenAddress = searchParams.get('tokenAddress');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const chain = params.chain;
    
    // Validate address format
    if (!blockchainService.isValidAddress(chain, address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    const balance = await blockchainService.getBalance(chain, address, tokenAddress);

    return NextResponse.json({
      chain,
      address,
      tokenAddress,
      balance
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
