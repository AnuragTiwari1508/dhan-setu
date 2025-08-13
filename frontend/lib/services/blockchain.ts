// Blockchain service inspired by BitCart and Hummingbot Gateway
import { ethers } from 'ethers';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import axios from 'axios';

export interface ChainConfig {
  name: string;
  rpcUrl: string;
  chainId?: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

// Supported chains configuration (inspired by Hummingbot Gateway)
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/your-infura-key',
    chainId: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://etherscan.io'
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorer: 'https://polygonscan.com'
  },
  bsc: {
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    chainId: 56,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    blockExplorer: 'https://bscscan.com'
  },
  arbitrum: {
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://arbiscan.io'
  },
  optimism: {
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  solana: {
    name: 'Solana',
    rpcUrl: clusterApiUrl('mainnet-beta'),
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    blockExplorer: 'https://explorer.solana.com'
  }
};

export class BlockchainService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private solanaConnection: Connection | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize EVM providers
    Object.entries(SUPPORTED_CHAINS).forEach(([chainKey, config]) => {
      if (chainKey !== 'solana') {
        try {
          const provider = new ethers.JsonRpcProvider(config.rpcUrl);
          this.providers.set(chainKey, provider);
        } catch (error) {
          console.error(`Failed to initialize provider for ${chainKey}:`, error);
        }
      }
    });

    // Initialize Solana connection
    try {
      this.solanaConnection = new Connection(clusterApiUrl('mainnet-beta'));
    } catch (error) {
      console.error('Failed to initialize Solana connection:', error);
    }
  }

  // Get provider for EVM chains
  getProvider(chain: string): ethers.JsonRpcProvider | null {
    return this.providers.get(chain) || null;
  }

  // Get Solana connection
  getSolanaConnection(): Connection | null {
    return this.solanaConnection;
  }

  // Get chain configuration
  getChainConfig(chain: string): ChainConfig | null {
    return SUPPORTED_CHAINS[chain] || null;
  }

  // Get all supported chains
  getSupportedChains(): string[] {
    return Object.keys(SUPPORTED_CHAINS);
  }

  // Get balance for EVM chains (inspired by BitCart)
  async getBalance(chain: string, address: string, tokenAddress?: string): Promise<string> {
    if (chain === 'solana') {
      return this.getSolanaBalance(address, tokenAddress);
    }

    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    try {
      if (!tokenAddress) {
        // Native token balance
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      } else {
        // ERC20 token balance
        return this.getERC20Balance(provider, address, tokenAddress);
      }
    } catch (error) {
      console.error(`Error getting balance for ${chain}:`, error);
      throw error;
    }
  }

  private async getERC20Balance(provider: ethers.JsonRpcProvider, address: string, tokenAddress: string): Promise<string> {
    const abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals()
    ]);
    
    return ethers.formatUnits(balance, decimals);
  }

  private async getSolanaBalance(address: string, mintAddress?: string): Promise<string> {
    if (!this.solanaConnection) {
      throw new Error('Solana connection not initialized');
    }

    try {
      const publicKey = new PublicKey(address);
      
      if (!mintAddress) {
        // SOL balance
        const balance = await this.solanaConnection.getBalance(publicKey);
        return (balance / 1e9).toString(); // Convert lamports to SOL
      } else {
        // SPL token balance
        const tokenAccounts = await this.solanaConnection.getTokenAccountsByOwner(
          publicKey,
          { mint: new PublicKey(mintAddress) }
        );
        
        if (tokenAccounts.value.length === 0) {
          return '0';
        }
        
        const accountInfo = await this.solanaConnection.getTokenAccountBalance(
          tokenAccounts.value[0].pubkey
        );
        
        return accountInfo.value.uiAmount?.toString() || '0';
      }
    } catch (error) {
      console.error('Error getting Solana balance:', error);
      throw error;
    }
  }

  // Validate address format
  isValidAddress(chain: string, address: string): boolean {
    try {
      if (chain === 'solana') {
        new PublicKey(address);
        return true;
      } else {
        return ethers.isAddress(address);
      }
    } catch {
      return false;
    }
  }

  // Get transaction status (inspired by Hummingbot Gateway polling)
  async getTransactionStatus(chain: string, txHash: string): Promise<{ 
    status: 'pending' | 'confirmed' | 'failed'; 
    blockNumber?: number;
    confirmations?: number;
  }> {
    if (chain === 'solana') {
      return this.getSolanaTransactionStatus(txHash);
    }

    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { status: 'pending' };
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        confirmations
      };
    } catch (error) {
      console.error(`Error getting transaction status for ${chain}:`, error);
      return { status: 'failed' };
    }
  }

  private async getSolanaTransactionStatus(signature: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    confirmations?: number;
  }> {
    if (!this.solanaConnection) {
      throw new Error('Solana connection not initialized');
    }

    try {
      const result = await this.solanaConnection.getSignatureStatus(signature);
      
      if (!result.value) {
        return { status: 'pending' };
      }

      const status = result.value.err ? 'failed' : 'confirmed';
      
      return {
        status,
        confirmations: result.value.confirmations || 0
      };
    } catch (error) {
      console.error('Error getting Solana transaction status:', error);
      return { status: 'failed' };
    }
  }

  // Get token information
  async getTokenInfo(chain: string, address: string): Promise<TokenInfo | null> {
    if (chain === 'solana') {
      // For Solana, you'd typically use a token registry or Jupiter API
      return null;
    }

    const provider = this.getProvider(chain);
    if (!provider) {
      return null;
    }

    try {
      const abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)'
      ];

      const contract = new ethers.Contract(address, abi, provider);
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      return {
        address,
        name,
        symbol,
        decimals
      };
    } catch (error) {
      console.error(`Error getting token info for ${address} on ${chain}:`, error);
      return null;
    }
  }

  // Get gas price estimation
  async getGasPrice(chain: string): Promise<string> {
    if (chain === 'solana') {
      // Solana uses a different fee structure
      return '0.000005'; // Typical Solana transaction fee
    }

    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    try {
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      return ethers.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.error(`Error getting gas price for ${chain}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();
