# DhanSetu Gateway - Complete Crypto Payment System

A comprehensive crypto payment gateway built with Next.js 15, integrating multiple open-source projects to provide a complete payment processing solution with support for multiple blockchains, subscription management, and wallet services.

## 🚀 Features

### Core Payment Processing
- **Multi-chain Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Solana
- **Payment Creation**: Generate payment links with QR codes
- **Real-time Monitoring**: Track payment status with blockchain confirmation
- **Webhook Support**: Automated notifications for payment events
- **Invoice Management**: Professional invoice generation and tracking

### Subscription Management
- **Recurring Payments**: Smart contract-based subscription billing
- **Plan Management**: Create and manage subscription tiers
- **Trial Periods**: Support for free trial periods
- **Automated Billing**: Cron-based billing system
- **Subscription Analytics**: Track MRR, churn, and growth metrics

### Wallet Services
- **HD Wallet Generation**: BIP39 mnemonic-based wallet creation
- **Multi-address Support**: Derive multiple addresses from master key
- **Secure Storage**: Encrypted wallet storage
- **Transaction Signing**: Sign transactions and messages
- **Balance Tracking**: Real-time balance monitoring

### Blockchain Integration
- **Provider Management**: Automatic failover between RPC providers
- **Gas Optimization**: Smart gas price estimation
- **Transaction Monitoring**: Real-time transaction status tracking
- **Network Switching**: Dynamic network selection
- **Token Support**: ERC20, BEP20, and SPL token support

## 🛠 Technology Stack

### Frontend
- **Next.js 15.2.4**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **Lucide React**: Beautiful icons

### Backend Services
- **Node.js**: JavaScript runtime
- **Ethers.js**: Ethereum interaction library
- **Solana Web3.js**: Solana blockchain integration
- **BIP39**: Mnemonic phrase generation
- **bcryptjs**: Password hashing and encryption
- **node-cron**: Scheduled task execution

### Database & Storage
- **In-memory Storage**: Development phase (easily extendable to PostgreSQL/MongoDB)
- **Redis**: Caching and session management (optional)

## 📋 Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd dhansetu-gateway
```

2. **Install dependencies**
```bash
# Using npm
npm install --legacy-peer-deps

# Using pnpm (recommended)
pnpm install
```

3. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

4. **Required Environment Variables**
```env
# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Security Keys
WALLET_ENCRYPTION_KEY=your-secure-encryption-key-32-chars-min
JWT_SECRET=your-jwt-secret-key-32-chars-min
WEBHOOK_SECRET=your-webhook-secret

# Default Wallets
ETHEREUM_WALLET=0xYourEthereumWalletAddress
SOLANA_WALLET=YourSolanaWalletAddress
```

5. **Start Development Server**
```bash
npm run dev
# or
pnpm dev
```

6. **Access the Application**
- Frontend: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs

## 🔧 API Endpoints

### Payment Management
```
POST   /api/payments           # Create payment
GET    /api/payments           # List payments
GET    /api/payments/[id]      # Get payment details
PATCH  /api/payments/[id]      # Update payment status
GET    /api/payments/stats     # Payment statistics
```

### Subscription Management
```
POST   /api/subscriptions      # Create subscription
GET    /api/subscriptions      # List subscriptions
GET    /api/subscriptions/[id] # Get subscription details
PATCH  /api/subscriptions/[id] # Update subscription
POST   /api/subscriptions/plans # Create plan
GET    /api/subscriptions/plans # List plans
GET    /api/subscriptions/stats # Subscription statistics
```

### Wallet Operations
```
POST   /api/wallets            # Create wallet
GET    /api/wallets/[id]       # Get wallet details
POST   /api/wallets/[id]/sign  # Sign transaction
GET    /api/wallets/[id]/balance # Get balance
```

### Blockchain Queries
```
GET    /api/chains             # List supported chains
GET    /api/chains/[network]   # Get network info
POST   /api/chains/[network]/tx # Send transaction
```

### Webhooks
```
POST   /api/webhooks/payment   # Payment webhook
POST   /api/webhooks/subscription # Subscription webhook
```

## 🏗 Architecture

### Service Layer
```
lib/services/
├── blockchain.ts      # Multi-chain blockchain interactions
├── payment.ts         # Payment processing logic
├── subscription.ts    # Subscription management
└── wallet.ts          # HD wallet operations
```

### API Routes
```
app/api/
├── payments/          # Payment endpoints
├── subscriptions/     # Subscription endpoints
├── wallets/          # Wallet endpoints
├── chains/           # Blockchain endpoints
└── webhooks/         # Webhook handlers
```

### Frontend Pages
```
app/
├── dashboard/        # Admin dashboard
├── payments/         # Payment management
├── pay/[id]/        # Payment checkout
└── subscriptions/   # Subscription management
```

## 🔒 Security Features

### Encryption & Hashing
- **Wallet Encryption**: AES-256 encryption for sensitive data
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure API access tokens
- **Webhook Verification**: HMAC signature validation

### API Security
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **CORS Configuration**: Controlled cross-origin access

## 🔗 Blockchain Integration

### Supported Networks
| Network | Chain ID | Currency | Status |
|---------|----------|----------|--------|
| Ethereum | 1 | ETH | ✅ Active |
| Polygon | 137 | MATIC | ✅ Active |
| BSC | 56 | BNB | ✅ Active |
| Arbitrum | 42161 | ETH | ✅ Active |
| Optimism | 10 | ETH | ✅ Active |
| Solana | - | SOL | ✅ Active |

### Token Support
- **ERC20**: All Ethereum-compatible tokens
- **BEP20**: Binance Smart Chain tokens
- **SPL**: Solana Program Library tokens
- **Native Currencies**: ETH, MATIC, BNB, SOL

## 💳 Payment Flow

### Standard Payment
1. **Create Payment**: Generate payment request with amount and currency
2. **Display QR Code**: Show QR code for wallet scanning
3. **Monitor Blockchain**: Watch for incoming transactions
4. **Confirm Payment**: Verify transaction and update status
5. **Send Webhook**: Notify merchant of payment completion

### Subscription Payment
1. **Create Plan**: Define subscription terms and pricing
2. **Customer Subscribe**: Generate subscription with trial period
3. **Automated Billing**: Cron job processes recurring payments
4. **Payment Processing**: Attempt payment through customer's saved method
5. **Status Updates**: Update subscription status based on payment result

## 📊 Monitoring & Analytics

### Payment Analytics
- Total payments processed
- Success/failure rates
- Average transaction value
- Popular payment methods
- Geographic distribution

### Subscription Metrics
- Monthly Recurring Revenue (MRR)
- Customer churn rate
- Trial conversion rate
- Plan popularity
- Billing retry success

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project integrates and builds upon several excellent open-source projects:

- **BitCart**: Invoice and payment processing architecture
- **Polygon P2P Payment**: Multi-chain payment concepts
- **Crypto-Payment-API**: API design patterns
- **CoindPay**: Payment gateway architecture
- **Spheron Subscriptions**: Smart contract subscription management
- **BitDiem Recur**: Recurring payment processing
- **Ethereum HDWallet**: HD wallet implementation
- **Hummingbot Gateway**: Blockchain provider management

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the [API Documentation](http://localhost:3000/api-docs)
- Review the [Wiki](https://github.com/your-repo/dhansetu-gateway/wiki)

## 🗺 Roadmap

### Phase 1 (Current)
- ✅ Multi-chain payment processing
- ✅ Subscription management
- ✅ HD wallet integration
- ✅ Basic dashboard and UI

### Phase 2 (Next)
- 🔄 Database integration (PostgreSQL)
- 🔄 Advanced analytics dashboard
- 🔄 Mobile app support
- 🔄 Webhook management UI

### Phase 3 (Future)
- ⏳ DeFi protocol integration
- ⏳ NFT payment support
- ⏳ Advanced security features
- ⏳ Multi-tenant architecture

---

Built with ❤️ by the DhanSetu team
