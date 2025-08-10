// API status and health check
import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';
import { paymentService } from '@/lib/services/payment';
import { subscriptionService } from '@/lib/services/subscription';
import { walletService } from '@/lib/services/wallet';

export async function GET(request: NextRequest) {
  try {
    // Check blockchain service status
    const chains = blockchainService.getSupportedChains();
    const chainStatus: Record<string, boolean> = {};
    
    for (const chain of chains) {
      try {
        if (chain === 'solana') {
          const connection = blockchainService.getSolanaConnection();
          chainStatus[chain] = connection !== null;
        } else {
          const provider = blockchainService.getProvider(chain);
          chainStatus[chain] = provider !== null;
        }
      } catch {
        chainStatus[chain] = false;
      }
    }

    // Get service statistics
    const paymentStats = paymentService.getPaymentStats();
    const subscriptionStats = subscriptionService.getSubscriptionStats();
    const walletStats = walletService.getWalletStats();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        blockchain: {
          status: 'operational',
          supportedChains: chains,
          chainStatus
        },
        payments: {
          status: 'operational',
          stats: paymentStats
        },
        subscriptions: {
          status: 'operational',
          stats: subscriptionStats
        },
        wallets: {
          status: 'operational',
          stats: walletStats
        }
      },
      endpoints: {
        payments: '/api/payments',
        subscriptions: '/api/subscriptions',
        wallets: '/api/wallets',
        chains: '/api/chains'
      }
    });

  } catch (error) {
    console.error('Error in health check:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
