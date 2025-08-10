// Wallets API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { walletService } from '@/lib/services/wallet';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, network, ...data } = body;
    
    if (!action || !name || !network) {
      return NextResponse.json(
        { error: 'Missing required fields: action, name, network' },
        { status: 400 }
      );
    }

    let wallet;

    switch (action) {
      case 'create_hd':
        wallet = await walletService.createHDWallet(
          name,
          network,
          data.mnemonic,
          data.hdPath,
          data.derivationIndex
        );
        break;
      
      case 'import':
        if (!data.privateKey) {
          return NextResponse.json(
            { error: 'Private key is required for import action' },
            { status: 400 }
          );
        }
        wallet = await walletService.importWallet(name, network, data.privateKey);
        break;
      
      case 'generate':
        wallet = await walletService.generateWallet(name, network);
        break;
      
      case 'derive':
        if (!data.parentWalletId || data.derivationIndex === undefined) {
          return NextResponse.json(
            { error: 'Parent wallet ID and derivation index are required for derive action' },
            { status: 400 }
          );
        }
        wallet = await walletService.deriveChildWallet(
          data.parentWalletId,
          name,
          data.derivationIndex
        );
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: create_hd, import, generate, derive' },
          { status: 400 }
        );
    }

    return NextResponse.json(wallet);

  } catch (error) {
    console.error('Error managing wallet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network');

    let wallets;
    
    if (network) {
      wallets = walletService.getWalletsByNetwork(network);
    } else {
      wallets = walletService.getAllWallets();
    }

    return NextResponse.json({
      wallets,
      total: wallets.length
    });

  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
