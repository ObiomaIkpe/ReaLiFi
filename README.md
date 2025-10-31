 # ReaLiFi

**Democratizing Real Estate Investment on Hedera Hashgraph**

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.28-blue.svg)](https://soliditylang.org/)
[![Hedera](https://img.shields.io/badge/Network-Hedera-purple.svg)](https://hedera.com/)

> **Invest in real estate with any amount. Own property with on-chain proof.**

ReaLiFi is a decentralized application (DApp) that removes traditional barriers to real estate investment by enabling fractional ownership, transparent transactions, and verifiable property rights—all powered by blockchain technology.

---

## 🎯 The Problem

Real estate investment has historically been inaccessible to average investors due to:

- **High Capital Requirements**: Traditional property investments require tens or hundreds of thousands of dollars
- **Lack of Liquidity**: Real estate assets are notoriously difficult to buy and sell quickly
- **Opacity & Trust Issues**: Property ownership records are often fragmented, outdated, or inaccessible
- **Geographic Limitations**: Investors are typically restricted to properties in their immediate vicinity
- **Complex Intermediaries**: Multiple middlemen increase costs and slow down transactions

**Result**: Millions of potential investors are locked out of one of the world's most stable asset classes.

---

## 💡 Our Solution

ReaLiFi leverages blockchain technology to make real estate investment:

### **Accessible**
- Fractional ownership starting with **with any amount**
- Invest in multiple properties to diversify your portfolio
- No geographic restrictions—invest globally from your device

### **Transparent**
- Every transaction recorded immutably on Hedera Hashgraph
- Complete ownership history and verification status publicly viewable
- Smart contracts eliminate ambiguity in agreements

### **Liquid**
- **Secondary marketplace** for peer-to-peer share trading
- Sell your fractional ownership anytime without waiting for full property sales
- Instant settlement via smart contracts

### **Secure**
- Non-custodial design—you control your assets
- Multi-admin verification system prevents fraudulent listings
- On-chain proof of ownership through NFT and fractional tokens

### **Profitable**
- **Automated dividend distribution** to all fractional owners
- Transparent fee structure (3% listing fee, 2% trading fee)
- Real-time portfolio tracking and performance metrics

---

## 🏗️ How It Works

### For Investors

1. **Browse Verified Properties**: View real estate listings that have passed multi-admin verification
2. **Choose Your Investment**: Buy entire properties or fractional shares starting with any amount even as low as $5 (paid in USDC)
3. **Receive Ownership Tokens**: Get NFTs (whole property) or ERC20 tokens (fractional shares) as proof of ownership
4. **Earn Dividends**: Receive automated rental income distributions proportional to your ownership
5. **Trade Anytime**: List your shares on the secondary marketplace or transfer them peer-to-peer

### For Property Owners/Sellers

1. **Register as Seller**: Create an account and complete seller registration
2. **List Your Property**: Upload property details, images, and documentation (stored on IPFS)
3. **Await Verification**: Multi-admin system verifies property authenticity and legal status
4. **Choose Sale Method**:
   - **Whole Sale**: Sell entire property as an NFT
   - **Fractional Sale**: Fractionalize property into affordable shares (admin-controlled for security)
5. **Receive Payment**: Get paid in USDC automatically when sales complete (minus 3% platform fee)

### Property Flow Diagram

```
Seller Registration → Property Listing → Multi-Admin Verification
                                                ↓
                                    ┌───────────┴───────────┐
                                    ↓                       ↓
                            Whole Purchase          Fractionalization
                                    ↓                       ↓
                            NFT Transfer        ERC20 Token Distribution
                                    ↓                       ↓
                            Full Ownership      Secondary Market Trading
                                                        ↓
                                                Dividend Distribution
```

---

## 🛠️ Technology Stack

### **Smart Contracts** (`contract` branch)
- **Language**: Solidity ^0.8.28
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin (ERC721, ERC20, ReentrancyGuard, SafeERC20)
- **Network**: Hedera Hashgraph
- **Payment Token**: USDC (stablecoin for predictable pricing)

**Key Contracts**:
- `ReaLiFi.sol`: Main marketplace contract handling listings, purchases, fractionalization, and secondary trading
- `RealifiFractionalToken.sol`: ERC20 token representing fractional property ownership

### **Backend** (`backend` branch)
- **Framework**: NestJS (TypeScript)
- **Storage**: IPFS (decentralized storage for property documents, images, and metadata)
- **APIs**: 
  - Property metadata management
  - IPFS pinning services
  - Off-chain indexing for faster queries
  - Admin verification workflows

### **Frontend** (`frontend` branch)
- **Framework**: React 
- **Build Tool**: Vite
- **Web3 Integration**: 
  - **RainbowKit**: Multi-wallet connection UI with mobile compatibility
  - **Wagmi**: React hooks for blockchain read/write operations
  - Custom Hedera configuration (manual network setup)
  - Access to many wallet providers
- **UI Features**:
  - Property marketplace browser
  - Portfolio dashboard with ownership percentages
  - Secondary market for P2P trading
  - Admin verification panel
  - Real-time transaction status
  - Responsive mobile-first design

---

## ✨ Core Features

### 🏠 Property Management
- **Non-custodial listings**: Sellers retain custody until sale completion
- **Multi-admin verification**: Prevents fraudulent listings through decentralized verification
- **IPFS metadata storage**: Permanent, tamper-proof property documentation
- **Flexible pricing**: Whole property or fractional share models

### 💰 Investment Options
- **Whole property purchases**: Buy entire properties as NFTs
- **Fractional ownership**: Invest as little as $5 in property shares
- **Portfolio diversification**: Track all investments in unified dashboard
- **Secondary market**: Buy/sell shares from other investors (2% platform fee)

### 📊 Financial Features
- **USDC transactions**: Stable, predictable pricing without crypto volatility
- **Automated dividends**: Smart contract distribution of rental income to fractional owners
- **Transparent fees**: 
  - 3% listing fee on property sales
  - 2% trading fee on secondary market transactions
  - 1% cancellation penalty (protects sellers from buyer flakiness)

### 🔐 Security & Verification
- **Multi-admin system**: Decentralized verification prevents single points of failure
- **Reentrancy protection**: SafeERC20 and ReentrancyGuard patterns throughout
- **Escrow mechanics**: Funds held securely until transaction completion
- **On-chain proof**: Immutable ownership records on Hedera Hashgraph

### 🤝 Secondary Marketplace
- **Peer-to-peer share trading**: List and buy fractional shares from other investors
- **Escrow-protected transactions**: Shares locked in contract until payment confirmed
- **Instant liquidity**: Exit positions without waiting for property sales
- **Direct transfers**: Send shares to other wallets for off-platform sales

---

## 📁 Repository Structure

Each component is developed in its own branch for clean separation of concerns. The `main` branch contains this comprehensive documentation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- npm or yarn
- Hedera testnet account
- USDC testnet tokens

### Clone Repository
```bash
git clone https://github.com/ObiomaIkpe/ReaLiFi.git
cd ReaLiFi
```

### Smart Contract Setup
```bash
git checkout contract
npm install
npx hardhat compile
npx hardhat test
# Deploy to Hedera Testnet
npx hardhat ignition deploy ignition/modules/ReaLiFi.js --network testnet
- Check contract branch readme for more details

### Backend Setup
```bash
git checkout backend
npm install
# Configure .env with IPFS credentials and contract addresses
npm run start:dev
```

### Frontend Setup
```bash
git checkout frontend
npm install
# Configure .env with backend API URL and contract addresses
npm run dev
```

---

## 🎯 Roadmap

### Phase 1: MVP (Current)
- ✅ Core smart contracts
- ✅ Basic frontend marketplace
- ✅ IPFS integration
- ✅ Admin verification system
- ✅ Secondary marketplace

### Phase 2: Enhanced UX (Q1 2026)
- 🔄 **Account Abstraction**: for seamless onboarding
- 🔄 **On/Off Ramp Integration**: Direct fiat-to-crypto conversion
- 🔄 **Mobile App**: Native iOS/Android applications

### Phase 3: Ecosystem Growth (Q2 2026)
- 🔄 **Real Estate Partnerships**: Integrate with property developers and agencies
- 🔄 **On-chain Verification**: Land registry integration for automated ownership verification
- 🔄 **Geographic Expansion**: Support for multiple countries and regulatory frameworks

### Phase 4: Maturity (Q3-Q4 2026)
- 🔄 **Smart Contract Upgrades**: Enhanced features based on user feedback
- 🔄 **Security Audit**: Comprehensive third-party audit by leading blockchain security firm
- 🔄 **Governance Token**: Community-driven platform decisions
- 🔄 **Institutional Features**: Bulk purchasing, white-label solutions

---

## 🔒 Security Considerations

- **Audits**: Contracts pending professional security audit
- **Testing**: Comprehensive unit and integration tests
- **Best Practices**: OpenZeppelin libraries, ReentrancyGuard, SafeERC20
- **Admin Controls**: Multi-signature admin system prevents single-point attacks
- **Testnet First**: All features tested on Hedera testnet before mainnet deployment

⚠️ **Disclaimer**: This is experimental software. Do not use with significant funds until professional audits are complete.

---

## 📄 License

UNLICENSED - Proprietary software. All rights reserved.

---

## 🤝 Contributing

We're building the future of real estate investment! Contributions welcome on specific branches:
- Smart contracts: `contract` branch
- Backend API: `backend` branch  
- Frontend UI: `frontend` branch

Please open issues for bugs or feature requests.

---

## 📞 Contact & Links

- **Repository**: [github.com/ObiomaIkpe/ReaLiFi](https://github.com/ObiomaIkpe/ReaLiFi)
- **Documentation**: See branch-specific READMEs for detailed setup
- **Network**: Hedera Hashgraph Testnet

---

## 🙏 Acknowledgments

- **Hedera Hashgraph** for fast, fair, and secure consensus
- **OpenZeppelin** for battle-tested smart contract libraries
- **IPFS** for decentralized storage infrastructure

---

**Built with ❤️ by Tech Scorpion and Obioma Ikpe**

*Making real estate investment accessible to everyone, one fraction at a time.*
