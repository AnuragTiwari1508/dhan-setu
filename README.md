# 🚀 DhanSetu Gateway - Complete Crypto Payment System  

<div align="center">  
  <img width="900" alt="DhanSetu Logo" src="https://github.com/user-attachments/assets/2e465ce4-f985-4142-b17f-01037e2a951b" />  
</div>  

---

## 🌟 Overview  
**DhanSetu Gateway** is a **comprehensive crypto payment system** built with **Next.js 15, TypeScript**, and **multi-blockchain support**. It enables modern crypto commerce with **secure payments, subscriptions, and invoicing** — all in one platform.  

👉 **Live Demo**: [http://localhost:3000](http://localhost:3000) (when running locally)  

---

## ✨ Key Features  

### 🔗 Multi-Chain Support  
- **6 Blockchains**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Solana  
- **Token Support**: Native currencies + ERC20/BEP20/SPL tokens  
- **Dynamic Network Switching**  

### 💰 Payment Processing  
- **QR Code Generation**: Instant payment links  
- **Real-Time Monitoring**: Track confirmations  
- **Webhook Support**: Automated merchant notifications  
- **Invoice System**: Professional payment management  

### 🔄 Subscription Engine  
- **Recurring Billing**: Cron-based automation  
- **Plan Management**: Flexible tiers & trial periods  
- **Analytics**: Track MRR & subscriber metrics  

### 🔐 Security  
- **HD Wallets**: BIP39-based generation  
- **AES-256 Encryption**: For sensitive data  
- **JWT Authentication**: Secure API access  
- **HMAC Webhook Verification**  

---

## 🏗️ Architecture  

### **Backend Services**  
lib/services/
├── blockchain.ts # Multi-chain blockchain integration
├── payment.ts # Payment processing service
├── subscription.ts # Recurring payments service
└── wallet.ts # HD wallet management

markdown
Copy
Edit

### **API Endpoints**  
/api/
├── payments/ # Payment management
├── subscriptions/ # Subscription handling
├── wallets/ # Wallet operations
└── chains/ # Blockchain queries

markdown
Copy
Edit

### **Frontend Pages**  
app/
├── dashboard/ # Analytics dashboard
├── payments/create/ # Payment creation
├── pay/[id]/ # Payment processing
├── subscriptions/ # Subscription management
└── api-docs/ # API documentation

yaml
Copy
Edit

---

## 🚀 Quick Start  

### **Prerequisites**  
- Node.js 18+  
- Git  
- A crypto wallet for testing  

### **Installation**  
```bash
# 1. Clone the repository
git clone https://github.com/AnuragTiwari1508/dhan-setu.git
cd dhan-setu

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Setup environment variables
cp .env.example .env.local
Edit .env.local with your configuration:

env
Copy
Edit
# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
WEBHOOK_SECRET=your-webhook-secret-key
bash
Copy
Edit
# 4. Run development server
npm run dev

# 5. Open in browser
http://localhost:3000
📊 Usage Examples
✅ Create a Payment
bash
Copy
Edit
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "0.1",
    "currency": "ETH",
    "network": "ethereum",
    "metadata": {
      "description": "Test payment",
      "customerEmail": "customer@example.com"
    }
  }'
✅ Check Payment Status
bash
Copy
Edit
curl http://localhost:3000/api/payments/PAYMENT_ID
✅ Create a Subscription Plan
bash
Copy
Edit
curl -X POST http://localhost:3000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Plan",
    "amount": "29.99",
    "currency": "USDC",
    "interval": "monthly"
  }'
🔧 API Documentation
Payment Endpoints
POST /api/payments → Create a payment

GET /api/payments → List payments

GET /api/payments/[id] → Get payment details

PATCH /api/payments/[id] → Update payment

GET /api/payments/stats → Payment statistics

Subscription Endpoints
POST /api/subscriptions → Create subscription

GET /api/subscriptions → List subscriptions

GET /api/subscriptions/[id] → Get details

PATCH /api/subscriptions/[id] → Update subscription

POST /api/subscriptions/plans → Create plan

GET /api/subscriptions/plans → List plans

GET /api/subscriptions/stats → Subscription stats

Wallet Endpoints
POST /api/wallets → Create wallet

GET /api/wallets/[id] → Wallet details

POST /api/wallets/[id]/sign → Sign transaction

GET /api/wallets/[id]/balance → Wallet balance

Blockchain Endpoints
GET /api/chains → Supported chains

GET /api/chains/[network] → Network details

POST /api/chains/[network]/tx → Send transaction

🛠️ Technology Stack
Frontend

Next.js 15.2.4

React 19

TypeScript

Tailwind CSS

shadcn/ui

Backend

Node.js

Ethers.js / Solana Web3.js

BIP39, bcryptjs

JWT

Supported Blockchains

Ethereum (ETH + ERC20)

Polygon (MATIC)

BSC (BNB + BEP20)

Arbitrum

Optimism

Solana (SOL + SPL tokens)

🔒 Security Features
HD Wallet generation (BIP39)

AES-256 encrypted storage

JWT-based API access

HMAC webhook verification

Request validation & rate limiting

📈 Analytics & Monitoring
Real-time payment stats

Transaction tracking

Revenue & MRR analytics

Subscription metrics

Network health status

🚀 Deployment
Render Deployment (Recommended)
Includes render.yaml for 1-click deployment.

Steps:

Fork repo → Push to GitHub

On Render: New + > Blueprint → Select repo

Configure environment variables

Deploy frontend + backend

Health Checks

Backend → /health

Frontend → /api-docs or /

Other options: Vercel, Docker, VPS

🤝 Contributing
bash
Copy
Edit
# 1. Fork repo
# 2. Create feature branch
git checkout -b feature/my-feature
# 3. Commit changes
git commit -m "Added new feature"
# 4. Push branch
git push origin feature/my-feature
# 5. Open Pull Request
📝 License
Licensed under MIT – see LICENSE.

🙏 Acknowledgments
BitCart – Payment processing architecture

Polygon P2P Payment – Multi-chain design

Crypto-Payment-API – API patterns

CoindPay – Gateway model

Spheron Subscriptions – Smart contracts

ethereum-hdwallet – Wallet implementation

Hummingbot Gateway – Blockchain provider mgmt

📞 Support
📧 Email: anuragtiwari1508@gmail.com
🐙 GitHub: AnuragTiwari1508

🔮 Roadmap
 Advanced analytics dashboard

 Mobile app support

 More blockchain integrations

 Smart contract upgrades

 Merchant APIs & tools

 Multi-language support
## 🌐 Multi-language Support  
Our project supports multiple languages to ensure accessibility and usability across diverse users worldwide.  

---

<div align="center">  
  <strong>Built with ❤️ by Anurag Tiwari</strong>  
  <br>  
  <a href="https://github.com/AnuragTiwari1508">GitHub</a> •  
  <a href="mailto:anuragtiwari1508@gmail.com">Email</a>  
</div>

