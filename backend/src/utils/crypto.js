const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Generate unique payment ID
const generatePaymentId = () => {
  return `pay_${uuidv4().replace(/-/g, '')}`;
};

// Generate unique subscription ID
const generateSubscriptionId = () => {
  return `sub_${uuidv4().replace(/-/g, '')}`;
};

// Generate API key
const generateApiKey = () => {
  return `ds_${crypto.randomBytes(32).toString('hex')}`;
};

// Generate wallet address (simplified - in production use proper derivation)
const generateWalletAddress = () => {
  return '0x' + crypto.randomBytes(20).toString('hex');
};

// Generate webhook secret
const generateWebhookSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create HMAC signature for webhook verification
const createHmacSignature = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
};

// Verify HMAC signature
const verifyHmacSignature = (payload, signature, secret) => {
  const expectedSignature = createHmacSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Hash password (additional utility)
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Validate Ethereum address
const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Validate transaction hash
const isValidTransactionHash = (hash) => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

// Format amount for display
const formatAmount = (amount, decimals = 18) => {
  const num = parseFloat(amount);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else if (num >= 1) {
    return num.toFixed(4);
  } else {
    return num.toFixed(8);
  }
};

// Convert wei to ether
const weiToEther = (wei) => {
  return (parseFloat(wei) / Math.pow(10, 18)).toString();
};

// Convert ether to wei
const etherToWei = (ether) => {
  return (parseFloat(ether) * Math.pow(10, 18)).toString();
};

// Generate EIP-681 payment URI
const generatePaymentUri = (address, amount, chainId, tokenAddress = null) => {
  let uri = `ethereum:${address}`;
  
  if (chainId) {
    uri += `@${chainId}`;
  }
  
  const params = [];
  if (amount) {
    params.push(`value=${amount}`);
  }
  
  if (tokenAddress) {
    params.push(`address=${tokenAddress}`);
  }
  
  if (params.length > 0) {
    uri += `?${params.join('&')}`;
  }
  
  return uri;
};

module.exports = {
  generatePaymentId,
  generateSubscriptionId,
  generateApiKey,
  generateWalletAddress,
  generateWebhookSecret,
  createHmacSignature,
  verifyHmacSignature,
  generateRandomString,
  hashPassword,
  isValidEthereumAddress,
  isValidTransactionHash,
  formatAmount,
  weiToEther,
  etherToWei,
  generatePaymentUri
};
