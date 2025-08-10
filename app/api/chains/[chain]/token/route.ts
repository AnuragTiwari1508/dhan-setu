// Chain token info API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';

export async function GET(
  request: NextRequest,
  { params }: { params: { chain: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'address parameter is required' },
        { status: 400 }
      );
    }

    const chain = params.chain;
    const tokenInfo = await blockchainService.getTokenInfo(chain, address);

    if (!tokenInfo) {
      return NextResponse.json(
        { error: 'Token not found or invalid address' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      chain,
      ...tokenInfo
    });

  } catch (error) {
    console.error('Error fetching token info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
