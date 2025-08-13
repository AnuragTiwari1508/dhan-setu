const express = require('express');
const blockchainService = require('../services/blockchainService');
const router = express.Router();

// Get supported networks
router.get('/', async (req, res) => {
  try {
    const networks = {
      mainnet: {
        ethereum: {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpcUrl: process.env.ETHEREUM_RPC_URL,
          explorerUrl: 'https://etherscan.io',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        polygon: {
          chainId: 137,
          name: 'Polygon Mainnet',
          rpcUrl: process.env.POLYGON_RPC_URL,
          explorerUrl: 'https://polygonscan.com',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
        }
      },
      testnet: {
        goerli: {
          chainId: 5,
          name: 'Goerli Testnet',
          rpcUrl: process.env.GOERLI_RPC_URL,
          explorerUrl: 'https://goerli.etherscan.io',
          nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 }
        },
        mumbai: {
          chainId: 80001,
          name: 'Mumbai Testnet',
          rpcUrl: process.env.MUMBAI_RPC_URL,
          explorerUrl: 'https://mumbai.polygonscan.com',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
        }
      }
    };

    res.json({
      success: true,
      data: { networks }
    });

  } catch (error) {
    console.error('Get networks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get network information
router.get('/:network', async (req, res) => {
  try {
    const { network } = req.params;
    
    const networkInfo = await blockchainService.getNetworkInfo(network);
    if (!networkInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Network not supported' 
      });
    }

    res.json({
      success: true,
      data: { network: networkInfo }
    });

  } catch (error) {
    console.error('Get network info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get account balance
router.get('/:network/balance/:address', async (req, res) => {
  try {
    const { network, address } = req.params;
    const { token } = req.query;

    const balance = await blockchainService.getBalance(address, network, token);

    res.json({
      success: true,
      data: {
        address,
        network,
        token: token || 'native',
        balance
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get gas estimation
router.post('/:network/gas', async (req, res) => {
  try {
    const { network } = req.params;
    const { to, value = '0', data = '0x' } = req.body;

    const gasInfo = await blockchainService.estimateGas(network, to, value, data);
    if (!gasInfo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gas estimation failed' 
      });
    }

    res.json({
      success: true,
      data: { gas: gasInfo }
    });

  } catch (error) {
    console.error('Gas estimation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get transaction details
router.get('/:network/transaction/:txHash', async (req, res) => {
  try {
    const { network, txHash } = req.params;

    const txDetails = await blockchainService.getTransactionDetails(txHash, network);
    if (!txDetails) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({
      success: true,
      data: { transaction: txDetails }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get supported tokens for a network
router.get('/:network/tokens', async (req, res) => {
  try {
    const { network } = req.params;

    const tokens = {
      ethereum: [
        {
          symbol: 'ETH',
          name: 'Ether',
          address: null,
          decimals: 18,
          logoUrl: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86a33E6b03b0E4A4D1E8B5F9E6F2C5D8B3c4e',
          decimals: 6,
          logoUrl: 'https://tokens.1inch.io/0xa0b86a33e6b03b0e4a4d1e8b5f9e6f2c5d8b3c4e.png'
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          decimals: 6,
          logoUrl: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
        }
      ],
      polygon: [
        {
          symbol: 'MATIC',
          name: 'Polygon',
          address: null,
          decimals: 18,
          logoUrl: 'https://tokens.1inch.io/0x0000000000000000000000000000000000001010.png'
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          decimals: 6,
          logoUrl: 'https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png'
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          decimals: 6,
          logoUrl: 'https://tokens.1inch.io/0xc2132d05d31c914a87c6611c10748aeb04b58e8f.png'
        }
      ],
      goerli: [
        {
          symbol: 'ETH',
          name: 'Goerli Ether',
          address: null,
          decimals: 18,
          logoUrl: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
        }
      ],
      mumbai: [
        {
          symbol: 'MATIC',
          name: 'Mumbai MATIC',
          address: null,
          decimals: 18,
          logoUrl: 'https://tokens.1inch.io/0x0000000000000000000000000000000000001010.png'
        }
      ]
    };

    const networkTokens = tokens[network] || [];

    res.json({
      success: true,
      data: {
        network,
        tokens: networkTokens
      }
    });

  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
