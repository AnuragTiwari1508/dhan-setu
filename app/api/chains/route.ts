// Chains API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';

export async function GET(request: NextRequest) {
  try {
    const chains = blockchainService.getSupportedChains();
    
    const chainDetails = chains.map(chainKey => {
      const config = blockchainService.getChainConfig(chainKey);
      return {
        key: chainKey,
        ...config
      };
    });

    return NextResponse.json({
      chains: chainDetails,
      total: chains.length
    });

  } catch (error) {
    console.error('Error fetching chains:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
