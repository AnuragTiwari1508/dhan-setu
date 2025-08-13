const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    this.providers = {
      ethereum: new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL),
      goerli: new ethers.JsonRpcProvider(process.env.GOERLI_RPC_URL),
      polygon: new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL),
      mumbai: new ethers.JsonRpcProvider(process.env.MUMBAI_RPC_URL)
    };

    this.contractAddresses = {
      ethereum: {
        payment: process.env.PAYMENT_CONTRACT_ETHEREUM,
        subscription: process.env.SUBSCRIPTION_CONTRACT_ETHEREUM
      },
      polygon: {
        payment: process.env.PAYMENT_CONTRACT_POLYGON,
        subscription: process.env.SUBSCRIPTION_CONTRACT_POLYGON
      },
      goerli: {
        payment: process.env.PAYMENT_CONTRACT_GOERLI,
        subscription: process.env.SUBSCRIPTION_CONTRACT_GOERLI
      },
      mumbai: {
        payment: process.env.PAYMENT_CONTRACT_MUMBAI,
        subscription: process.env.SUBSCRIPTION_CONTRACT_MUMBAI
      }
    };
  }

  // Get provider for network
  getProvider(network) {
    const provider = this.providers[network];
    if (!provider) {
      throw new Error(`Unsupported network: ${network}`);
    }
    return provider;
  }

  // Get wallet instance
  getWallet(network) {
    const provider = this.getProvider(network);
    return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  }

  // Verify transaction on blockchain
  async verifyTransaction(txHash, network, expectedAmount, tokenAddress = null) {
    try {
      const provider = this.getProvider(network);
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!tx || !receipt || receipt.status !== 1) {
        return false;
      }

      // For ETH transactions
      if (!tokenAddress) {
        const actualAmount = ethers.formatEther(tx.value);
        return parseFloat(actualAmount) >= parseFloat(expectedAmount);
      }

      // For ERC20 transactions
      // Parse transfer events from logs
      const transferTopic = ethers.id('Transfer(address,address,uint256)');
      const transferLog = receipt.logs.find(log => 
        log.topics[0] === transferTopic && 
        log.address.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (!transferLog) {
        return false;
      }

      const amount = ethers.getBigInt(transferLog.data);
      const actualAmount = ethers.formatUnits(amount, 18); // Assuming 18 decimals
      
      return parseFloat(actualAmount) >= parseFloat(expectedAmount);

    } catch (error) {
      console.error('Transaction verification error:', error);
      return false;
    }
  }

  // Get transaction details
  async getTransactionDetails(txHash, network) {
    try {
      const provider = this.getProvider(network);
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!tx || !receipt) {
        return null;
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        confirmations: await tx.confirmations()
      };

    } catch (error) {
      console.error('Get transaction details error:', error);
      return null;
    }
  }

  // Get account balance
  async getBalance(address, network, tokenAddress = null) {
    try {
      const provider = this.getProvider(network);

      if (!tokenAddress) {
        // ETH balance
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      }

      // ERC20 balance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );

      const balance = await tokenContract.balanceOf(address);
      return ethers.formatUnits(balance, 18); // Assuming 18 decimals

    } catch (error) {
      console.error('Get balance error:', error);
      return '0';
    }
  }

  // Estimate gas for transaction
  async estimateGas(network, to, value = '0', data = '0x') {
    try {
      const provider = this.getProvider(network);
      const gasEstimate = await provider.estimateGas({
        to,
        value: ethers.parseEther(value),
        data
      });

      const gasPrice = await provider.getFeeData();

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : null,
        maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') : null
      };

    } catch (error) {
      console.error('Gas estimation error:', error);
      return null;
    }
  }

  // Get network info
  async getNetworkInfo(network) {
    try {
      const provider = this.getProvider(network);
      const networkInfo = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = await provider.getFeeData();

      return {
        chainId: networkInfo.chainId.toString(),
        name: networkInfo.name,
        blockNumber,
        gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : null
      };

    } catch (error) {
      console.error('Get network info error:', error);
      return null;
    }
  }

  // Generate wallet
  generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase
    };
  }

  // Create payment contract instance
  getPaymentContract(network) {
    const address = this.contractAddresses[network]?.payment;
    if (!address) {
      throw new Error(`Payment contract not deployed on ${network}`);
    }

    const provider = this.getProvider(network);
    // Payment contract ABI (simplified)
    const abi = [
      'function createPayment(string memory paymentId, address token, uint256 amount, string memory description)',
      'function completePayment(string memory paymentId) payable',
      'function getPayment(string memory paymentId) view returns (tuple(address merchant, address customer, address token, uint256 amount, uint256 timestamp, bool completed, string paymentId, string description))',
      'event PaymentCreated(string indexed paymentId, address indexed merchant, address token, uint256 amount, string description)',
      'event PaymentCompleted(string indexed paymentId, address indexed customer, uint256 amount, uint256 fee)'
    ];

    return new ethers.Contract(address, abi, provider);
  }

  // Create subscription contract instance
  getSubscriptionContract(network) {
    const address = this.contractAddresses[network]?.subscription;
    if (!address) {
      throw new Error(`Subscription contract not deployed on ${network}`);
    }

    const provider = this.getProvider(network);
    // Subscription contract ABI (simplified)
    const abi = [
      'function createPlan(address token, uint256 amount, uint256 interval, string memory name, string memory description) returns (uint256)',
      'function subscribe(uint256 planId) payable returns (uint256)',
      'function processSubscriptionPayment(uint256 subscriptionId)',
      'function cancelSubscription(uint256 subscriptionId)',
      'function getSubscription(uint256 subscriptionId) view returns (tuple(address subscriber, uint256 planId, uint256 nextPayment, uint256 lastPayment, bool active, uint256 totalPaid, uint256 paymentCount))',
      'function getPlan(uint256 planId) view returns (tuple(address merchant, address token, uint256 amount, uint256 interval, bool active, string name, string description))',
      'event PlanCreated(uint256 indexed planId, address indexed merchant, address token, uint256 amount, uint256 interval, string name)',
      'event SubscriptionCreated(uint256 indexed subscriptionId, uint256 indexed planId, address indexed subscriber)',
      'event PaymentProcessed(uint256 indexed subscriptionId, uint256 amount, uint256 fee, uint256 nextPayment)'
    ];

    return new ethers.Contract(address, abi, provider);
  }

  // Listen for contract events
  async listenForEvents(network, contractType = 'payment') {
    try {
      const contract = contractType === 'payment' 
        ? this.getPaymentContract(network)
        : this.getSubscriptionContract(network);

      // Listen for payment completion events
      if (contractType === 'payment') {
        contract.on('PaymentCompleted', (paymentId, customer, amount, fee, event) => {
          console.log('Payment completed on blockchain:', {
            paymentId,
            customer,
            amount: ethers.formatEther(amount),
            fee: ethers.formatEther(fee),
            txHash: event.transactionHash
          });
          
          // TODO: Update database and send webhooks
        });
      }

      // Listen for subscription events
      if (contractType === 'subscription') {
        contract.on('PaymentProcessed', (subscriptionId, amount, fee, nextPayment, event) => {
          console.log('Subscription payment processed:', {
            subscriptionId: subscriptionId.toString(),
            amount: ethers.formatEther(amount),
            fee: ethers.formatEther(fee),
            nextPayment: new Date(Number(nextPayment) * 1000),
            txHash: event.transactionHash
          });
          
          // TODO: Update database and send webhooks
        });
      }

    } catch (error) {
      console.error('Event listening error:', error);
    }
  }
}

module.exports = new BlockchainService();
