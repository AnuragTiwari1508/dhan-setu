// Wallet service inspired by ethereum-hdwallet and Hummingbot Gateway
import { ethers } from 'ethers';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface WalletInfo {
  id: string;
  name: string;
  address: string;
  network: string;
  type: 'hd' | 'imported' | 'generated';
  hdPath?: string;
  publicKey?: string;
  encrypted: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface HDWalletInfo extends WalletInfo {
  type: 'hd';
  derivationIndex: number;
  parentWalletId?: string;
}

export interface WalletBalance {
  address: string;
  network: string;
  nativeBalance: string;
  tokenBalances: Array<{
    symbol: string;
    address: string;
    balance: string;
    decimals: number;
    usdValue?: string;
  }>;
  totalUsdValue?: string;
  lastUpdated: Date;
}

interface StoredWallet {
  id: string;
  name: string;
  network: string;
  type: 'hd' | 'imported' | 'generated';
  encryptedData: string; // Contains private key/mnemonic
  address: string;
  publicKey?: string;
  hdPath?: string;
  derivationIndex?: number;
  parentWalletId?: string;
  createdAt: Date;
  lastUsed?: Date;
}

// In-memory storage (replace with secure database in production)
const wallets = new Map<string, StoredWallet>();
const walletBalances = new Map<string, WalletBalance>();

export class WalletService {
  private encryptionKey: string;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || process.env.WALLET_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Generate new mnemonic (inspired by ethereum-hdwallet)
  generateMnemonic(): string {
    return bip39.generateMnemonic(256); // 24 words for better security
  }

  // Validate mnemonic
  isValidMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  // Create HD wallet from mnemonic
  async createHDWallet(
    name: string,
    network: string,
    mnemonic?: string,
    hdPath?: string,
    derivationIndex = 0
  ): Promise<WalletInfo> {
    const walletMnemonic = mnemonic || this.generateMnemonic();
    
    if (!this.isValidMnemonic(walletMnemonic)) {
      throw new Error('Invalid mnemonic provided');
    }

    const walletId = `wallet_${uuidv4()}`;
    const fullHdPath = hdPath || this.getDefaultHdPath(network, derivationIndex);
    
    let address: string;
    let publicKey: string | undefined;

    if (network === 'solana') {
      // Generate Solana wallet from mnemonic
      const seed = await bip39.mnemonicToSeed(walletMnemonic);
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      address = keypair.publicKey.toBase58();
      publicKey = keypair.publicKey.toBase58();
    } else {
      // Generate Ethereum-compatible wallet
      const hdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(walletMnemonic),
        fullHdPath
      );
      address = hdNode.address;
      publicKey = hdNode.publicKey;
    }

    // Encrypt sensitive data
    const encryptedData = await this.encryptSensitiveData({
      mnemonic: walletMnemonic,
      hdPath: fullHdPath
    });

    const storedWallet: StoredWallet = {
      id: walletId,
      name,
      network,
      type: 'hd',
      encryptedData,
      address,
      publicKey,
      hdPath: fullHdPath,
      derivationIndex,
      createdAt: new Date()
    };

    wallets.set(walletId, storedWallet);

    return this.toWalletInfo(storedWallet);
  }

  // Import wallet from private key
  async importWallet(name: string, network: string, privateKey: string): Promise<WalletInfo> {
    const walletId = `wallet_${uuidv4()}`;
    let address: string;
    let publicKey: string | undefined;

    try {
      if (network === 'solana') {
        // Import Solana wallet
        const secretKey = new Uint8Array(JSON.parse(privateKey));
        const keypair = Keypair.fromSecretKey(secretKey);
        address = keypair.publicKey.toBase58();
        publicKey = keypair.publicKey.toBase58();
      } else {
        // Import Ethereum-compatible wallet
        const wallet = new ethers.Wallet(privateKey);
        address = wallet.address;
        publicKey = wallet.publicKey;
      }
    } catch (error) {
      throw new Error('Invalid private key format');
    }

    // Encrypt private key
    const encryptedData = await this.encryptSensitiveData({ privateKey });

    const storedWallet: StoredWallet = {
      id: walletId,
      name,
      network,
      type: 'imported',
      encryptedData,
      address,
      publicKey,
      createdAt: new Date()
    };

    wallets.set(walletId, storedWallet);

    return this.toWalletInfo(storedWallet);
  }

  // Generate new wallet with random private key
  async generateWallet(name: string, network: string): Promise<WalletInfo> {
    const walletId = `wallet_${uuidv4()}`;
    let address: string;
    let publicKey: string | undefined;
    let privateKey: string;

    if (network === 'solana') {
      // Generate Solana wallet
      const keypair = Keypair.generate();
      address = keypair.publicKey.toBase58();
      publicKey = keypair.publicKey.toBase58();
      privateKey = JSON.stringify(Array.from(keypair.secretKey));
    } else {
      // Generate Ethereum-compatible wallet
      const wallet = ethers.Wallet.createRandom();
      address = wallet.address;
      publicKey = wallet.publicKey;
      privateKey = wallet.privateKey;
    }

    // Encrypt private key
    const encryptedData = await this.encryptSensitiveData({ privateKey });

    const storedWallet: StoredWallet = {
      id: walletId,
      name,
      network,
      type: 'generated',
      encryptedData,
      address,
      publicKey,
      createdAt: new Date()
    };

    wallets.set(walletId, storedWallet);

    return this.toWalletInfo(storedWallet);
  }

  // Derive child wallet from HD wallet
  async deriveChildWallet(
    parentWalletId: string,
    name: string,
    derivationIndex: number
  ): Promise<WalletInfo> {
    const parentWallet = wallets.get(parentWalletId);
    if (!parentWallet || parentWallet.type !== 'hd') {
      throw new Error('Parent wallet not found or is not an HD wallet');
    }

    const decryptedData = await this.decryptSensitiveData(parentWallet.encryptedData);
    if (!decryptedData.mnemonic) {
      throw new Error('Parent wallet mnemonic not found');
    }

    const childWalletId = `wallet_${uuidv4()}`;
    const hdPath = this.getDefaultHdPath(parentWallet.network, derivationIndex);
    
    let address: string;
    let publicKey: string | undefined;

    if (parentWallet.network === 'solana') {
      // Derive Solana child wallet
      const seed = await bip39.mnemonicToSeed(decryptedData.mnemonic);
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      address = keypair.publicKey.toBase58();
      publicKey = keypair.publicKey.toBase58();
    } else {
      // Derive Ethereum-compatible child wallet
      const hdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(decryptedData.mnemonic),
        hdPath
      );
      address = hdNode.address;
      publicKey = hdNode.publicKey;
    }

    // Encrypt child wallet data
    const encryptedData = await this.encryptSensitiveData({
      mnemonic: decryptedData.mnemonic,
      hdPath
    });

    const childWallet: StoredWallet = {
      id: childWalletId,
      name,
      network: parentWallet.network,
      type: 'hd',
      encryptedData,
      address,
      publicKey,
      hdPath,
      derivationIndex,
      parentWalletId,
      createdAt: new Date()
    };

    wallets.set(childWalletId, childWallet);

    return this.toWalletInfo(childWallet);
  }

  // Get wallet by ID
  getWallet(walletId: string): WalletInfo | null {
    const wallet = wallets.get(walletId);
    return wallet ? this.toWalletInfo(wallet) : null;
  }

  // Get all wallets
  getAllWallets(): WalletInfo[] {
    return Array.from(wallets.values()).map(wallet => this.toWalletInfo(wallet));
  }

  // Get wallets by network
  getWalletsByNetwork(network: string): WalletInfo[] {
    return Array.from(wallets.values())
      .filter(wallet => wallet.network === network)
      .map(wallet => this.toWalletInfo(wallet));
  }

  // Remove wallet
  removeWallet(walletId: string): boolean {
    const wallet = wallets.get(walletId);
    if (!wallet) return false;

    // Remove child wallets if this is a parent HD wallet
    if (wallet.type === 'hd') {
      const childWallets = Array.from(wallets.values())
        .filter(w => w.parentWalletId === walletId);
      
      childWallets.forEach(child => wallets.delete(child.id));
    }

    return wallets.delete(walletId);
  }

  // Sign message with wallet
  async signMessage(walletId: string, message: string): Promise<string> {
    const wallet = wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const decryptedData = await this.decryptSensitiveData(wallet.encryptedData);
    
    if (wallet.network === 'solana') {
      // Sign with Solana wallet
      let keypair: Keypair;
      
      if (decryptedData.privateKey) {
        const secretKey = new Uint8Array(JSON.parse(decryptedData.privateKey));
        keypair = Keypair.fromSecretKey(secretKey);
      } else if (decryptedData.mnemonic) {
        const seed = await bip39.mnemonicToSeed(decryptedData.mnemonic);
        keypair = Keypair.fromSeed(seed.slice(0, 32));
      } else {
        throw new Error('No signing key available');
      }

      const messageBytes = Buffer.from(message, 'utf8');
      const signature = keypair.sign(messageBytes);
      return Buffer.from(signature).toString('hex');
    } else {
      // Sign with Ethereum-compatible wallet
      let ethersWallet: ethers.Wallet;
      
      if (decryptedData.privateKey) {
        ethersWallet = new ethers.Wallet(decryptedData.privateKey);
      } else if (decryptedData.mnemonic && wallet.hdPath) {
        const hdNode = ethers.HDNodeWallet.fromMnemonic(
          ethers.Mnemonic.fromPhrase(decryptedData.mnemonic),
          wallet.hdPath
        );
        ethersWallet = new ethers.Wallet(hdNode.privateKey);
      } else {
        throw new Error('No signing key available');
      }

      return await ethersWallet.signMessage(message);
    }
  }

  // Update wallet usage timestamp
  updateLastUsed(walletId: string): void {
    const wallet = wallets.get(walletId);
    if (wallet) {
      wallet.lastUsed = new Date();
      wallets.set(walletId, wallet);
    }
  }

  // Backup wallet (export encrypted data)
  async backupWallet(walletId: string): Promise<{
    id: string;
    name: string;
    network: string;
    type: string;
    mnemonic?: string;
    privateKey?: string;
    hdPath?: string;
    address: string;
  }> {
    const wallet = wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const decryptedData = await this.decryptSensitiveData(wallet.encryptedData);

    return {
      id: wallet.id,
      name: wallet.name,
      network: wallet.network,
      type: wallet.type,
      mnemonic: decryptedData.mnemonic,
      privateKey: decryptedData.privateKey,
      hdPath: wallet.hdPath,
      address: wallet.address
    };
  }

  // Private helper methods

  private getDefaultHdPath(network: string, index = 0): string {
    if (network === 'solana') {
      return `m/44'/501'/${index}'/0'`; // Solana derivation path
    } else {
      return `m/44'/60'/${index}'/0/0`; // Ethereum derivation path
    }
  }

  private async encryptSensitiveData(data: any): Promise<string> {
    const jsonData = JSON.stringify(data);
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(jsonData + this.encryptionKey, salt);
  }

  private async decryptSensitiveData(encryptedData: string): Promise<any> {
    // This is a simplified decryption - in production, use proper encryption/decryption
    // For now, we'll store the original data (this should be replaced with real encryption)
    throw new Error('Decryption not implemented - use proper encryption in production');
  }

  private toWalletInfo(stored: StoredWallet): WalletInfo {
    return {
      id: stored.id,
      name: stored.name,
      address: stored.address,
      network: stored.network,
      type: stored.type,
      hdPath: stored.hdPath,
      publicKey: stored.publicKey,
      encrypted: true,
      createdAt: stored.createdAt,
      lastUsed: stored.lastUsed
    };
  }

  // Wallet statistics
  getWalletStats(): {
    totalWallets: number;
    walletsByNetwork: Record<string, number>;
    walletsByType: Record<string, number>;
  } {
    const allWallets = Array.from(wallets.values());
    
    const walletsByNetwork: Record<string, number> = {};
    const walletsByType: Record<string, number> = {};

    allWallets.forEach(wallet => {
      walletsByNetwork[wallet.network] = (walletsByNetwork[wallet.network] || 0) + 1;
      walletsByType[wallet.type] = (walletsByType[wallet.type] || 0) + 1;
    });

    return {
      totalWallets: allWallets.length,
      walletsByNetwork,
      walletsByType
    };
  }
}

// Singleton instance
export const walletService = new WalletService();
