// Payment service inspired by BitCart and Crypto-Payment-API
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { blockchainService } from './blockchain';

export interface PaymentRequest {
  id?: string;
  amount: string;
  currency: string;
  network: string;
  description?: string;
  customerEmail?: string;
  redirectUrl?: string;
  webhookUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  amount: string;
  currency: string;
  network: string;
  status: 'pending' | 'confirmed' | 'expired' | 'failed';
  walletAddress: string;
  paymentLink: string;
  qrData: string;
  expiresAt: Date;
  createdAt: Date;
  confirmedAt?: Date;
  transactionHash?: string;
  metadata?: Record<string, any>;
}

export interface WalletConfig {
  address: string;
  privateKey?: string; // Only for server-side operations
  mnemonic?: string;
}

// In-memory storage (replace with database in production)
const payments = new Map<string, PaymentResponse>();
const wallets = new Map<string, WalletConfig>();

export class PaymentService {
  private defaultWallets: Record<string, string> = {
    ethereum: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    polygon: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    bsc: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    arbitrum: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    optimism: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
  };

  // Create a new payment request (inspired by BitCart's invoice creation)
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const paymentId = request.id || `pay_${uuidv4()}`;
    const walletAddress = this.getWalletAddress(request.network);
    
    if (!walletAddress) {
      throw new Error(`No wallet configured for network: ${request.network}`);
    }

    // Validate network support
    if (!blockchainService.getSupportedChains().includes(request.network)) {
      throw new Error(`Unsupported network: ${request.network}`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentLink = `${baseUrl}/pay/${paymentId}`;
    const qrData = this.generateQRData(request.network, walletAddress, request.amount, request.currency);
    
    const expiresAt = request.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default
    
    const payment: PaymentResponse = {
      id: paymentId,
      amount: request.amount,
      currency: request.currency,
      network: request.network,
      status: 'pending',
      walletAddress,
      paymentLink,
      qrData,
      expiresAt,
      createdAt: new Date(),
      metadata: request.metadata
    };

    payments.set(paymentId, payment);
    
    // Start monitoring for this payment
    this.startPaymentMonitoring(paymentId);
    
    return payment;
  }

  // Get payment by ID
  getPayment(paymentId: string): PaymentResponse | null {
    return payments.get(paymentId) || null;
  }

  // Get all payments (with pagination)
  getPayments(limit = 50, offset = 0): PaymentResponse[] {
    const allPayments = Array.from(payments.values());
    return allPayments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  // Update payment status
  updatePaymentStatus(paymentId: string, status: PaymentResponse['status'], transactionHash?: string): boolean {
    const payment = payments.get(paymentId);
    if (!payment) return false;

    payment.status = status;
    if (transactionHash) {
      payment.transactionHash = transactionHash;
    }
    if (status === 'confirmed') {
      payment.confirmedAt = new Date();
    }

    payments.set(paymentId, payment);
    return true;
  }

  // Generate QR code data for payment (inspired by polygon-peer-to-peer-payment)
  private generateQRData(network: string, address: string, amount: string, currency: string): string {
    if (network === 'solana') {
      // Solana Pay URI format
      return `solana:${address}?amount=${amount}&label=Payment&message=DhanSetu%20Payment`;
    } else {
      // EIP-681 format for Ethereum-compatible chains
      const chainConfig = blockchainService.getChainConfig(network);
      if (!chainConfig) throw new Error(`Unknown network: ${network}`);

      if (currency === chainConfig.nativeCurrency.symbol) {
        // Native token payment
        const weiAmount = ethers.parseEther(amount).toString();
        return `ethereum:${address}?value=${weiAmount}`;
      } else {
        // ERC20 token payment - would need token contract address
        return `ethereum:${address}?value=0&data=0x`;
      }
    }
  }

  // Get wallet address for network
  private getWalletAddress(network: string): string | null {
    return this.defaultWallets[network] || null;
  }

  // Start monitoring payment (inspired by BitCart's payment tracking)
  private async startPaymentMonitoring(paymentId: string): Promise<void> {
    const payment = payments.get(paymentId);
    if (!payment) return;

    // Check if payment is expired
    if (new Date() > payment.expiresAt) {
      this.updatePaymentStatus(paymentId, 'expired');
      return;
    }

    try {
      // Check balance changes on the wallet address
      const balance = await blockchainService.getBalance(
        payment.network,
        payment.walletAddress,
        payment.currency === blockchainService.getChainConfig(payment.network)?.nativeCurrency.symbol ? undefined : payment.currency
      );

      // This is a simplified version - in production, you'd track balance changes
      // and match incoming transactions to specific payments using memos or unique addresses
      console.log(`Monitoring payment ${paymentId}, current balance: ${balance}`);

      // Schedule next check
      setTimeout(() => this.startPaymentMonitoring(paymentId), 30000); // Check every 30 seconds
    } catch (error) {
      console.error(`Error monitoring payment ${paymentId}:`, error);
    }
  }

  // Validate incoming payment (inspired by Crypto-Payment-API's memo system)
  async validatePayment(paymentId: string, transactionHash: string): Promise<boolean> {
    const payment = payments.get(paymentId);
    if (!payment || payment.status !== 'pending') {
      return false;
    }

    try {
      const txStatus = await blockchainService.getTransactionStatus(payment.network, transactionHash);
      
      if (txStatus.status === 'confirmed') {
        this.updatePaymentStatus(paymentId, 'confirmed', transactionHash);
        
        // Trigger webhook if configured
        if (payment.metadata?.webhookUrl) {
          this.triggerWebhook(payment.metadata.webhookUrl, payment);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error validating payment ${paymentId}:`, error);
      return false;
    }
  }

  // Trigger webhook notification
  private async triggerWebhook(webhookUrl: string, payment: PaymentResponse): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DhanSetu-Gateway/1.0'
        },
        body: JSON.stringify({
          event: 'payment.confirmed',
          payment: {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            network: payment.network,
            status: payment.status,
            transactionHash: payment.transactionHash,
            confirmedAt: payment.confirmedAt
          }
        })
      });
    } catch (error) {
      console.error('Error triggering webhook:', error);
    }
  }

  // Get payment statistics
  getPaymentStats(): {
    totalPayments: number;
    totalAmount: number;
    confirmedPayments: number;
    pendingPayments: number;
    failedPayments: number;
  } {
    const allPayments = Array.from(payments.values());
    
    return {
      totalPayments: allPayments.length,
      totalAmount: allPayments
        .filter(p => p.status === 'confirmed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
      confirmedPayments: allPayments.filter(p => p.status === 'confirmed').length,
      pendingPayments: allPayments.filter(p => p.status === 'pending').length,
      failedPayments: allPayments.filter(p => p.status === 'failed').length
    };
  }

  // Search payments
  searchPayments(query: string): PaymentResponse[] {
    const allPayments = Array.from(payments.values());
    const lowerQuery = query.toLowerCase();
    
    return allPayments.filter(payment =>
      payment.id.toLowerCase().includes(lowerQuery) ||
      payment.walletAddress.toLowerCase().includes(lowerQuery) ||
      payment.transactionHash?.toLowerCase().includes(lowerQuery) ||
      payment.metadata?.customerEmail?.toLowerCase().includes(lowerQuery)
    );
  }
}

// Singleton instance
export const paymentService = new PaymentService();
