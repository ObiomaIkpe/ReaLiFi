# RealEstateDApp

A decentralized application (DApp) for real estate asset management, enabling non-custodial listing, fractional ownership, and trading of properties on the Hedera Hashgraph using USDC as the payment token. Built with Solidity ^0.8.28, Hardhat, and OpenZeppelin, the platform supports secure, transparent real estate transactions with features like multi-admin verification, seller registration, comprehensive portfolio tracking, and automated dividend distribution.

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.28-blue)](https://docs.soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-v4.9.0-green)](https://openzeppelin.com/contracts/)
[![Hardhat](https://img.shields.io/badge/Hardhat-v2.24.0-yellow)](https://hardhat.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red)](LICENSE)

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Usage Examples](#usage-examples)
- [Security](#security)
- [Gas Optimization](#gas-optimization)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Project Overview

RealiFi is a comprehensive decentralized platform designed to revolutionize real estate investment by enabling:

- **Property Tokenization**: Convert real estate assets into NFTs (ERC-721) with detailed metadata
- **Fractional Ownership**: Split properties into ERC-20 tokens for accessible investment
- **Secure Transactions**: All payments handled in USDC stablecoin for price stability
- **Multi-Admin System**: Distributed verification and management authority
- **Dividend Distribution**: Automated proportional payouts to fractional investors
- **Complete Transparency**: All transactions and ownership tracked on-chain

### Key Goals

1. **Democratize Real Estate Investment**: Lower barriers to entry through fractional ownership
2. **Ensure Security**: Leverage OpenZeppelin's battle-tested contracts and ReentrancyGuard
3. **Maintain Transparency**: All transactions publicly verifiable on blockchain
4. **Non-Custodial Architecture**: Sellers retain control until sale completion
5. **Scalable Design**: Support for unlimited assets and fractional investors

### Platform Economics

- **Listing Fee**: 3% charged on successful asset sales (paid to platform)
- **Cancellation Penalty**: 1% charged on buyer cancellations (paid to platform)
- **Fractional Trading**: Zero fees on fractional purchases (sellers receive full payment)
- **Dividend Distribution**: No platform fees (100% distributed to token holders)

## Features

### Core Features

#### 🏠 Asset Management
- **Asset Creation**: Registered sellers mint NFTs representing real estate properties
- **Metadata Storage**: IPFS integration for decentralized asset information
- **Multi-Admin Verification**: Distributed authority for asset approval
- **Asset Delisting**: Admins can remove problematic listings with automatic refunds
- **Status Tracking**: Real-time monitoring of asset lifecycle (created → verified → sold)

#### 👥 User Management
- **Seller Registration**: One-time registration required to list properties
- **Multi-Admin System**: Owner can add/remove multiple admins
- **Seller Metrics**: Track confirmed and canceled purchase counts
- **Portfolio Views**: Comprehensive dashboards for buyers and sellers

#### 💰 Transaction Handling
- **Full Asset Purchase**: Buy entire property ownership
- **Two-Step Purchase Flow**: Payment lock → buyer confirmation → ownership transfer
- **Cancellation Mechanism**: Buyers can cancel with 1% penalty
- **USDC Payments**: All transactions in USDC stablecoin
- **Automatic Fee Distribution**: Platform fees auto-sent to owner

#### 🔀 Fractional Ownership
- **Asset Fractionalization**: Admins split assets into ERC-20 tokens
- **Partial Purchases**: Buy any amount of available tokens
- **Dynamic Pricing**: Price per token = total price / token count
- **Ownership Tracking**: Precise percentage calculations for all investors
- **Cancellation Support**: Fractional buyers can exit investments anytime or sell shares
- **Full Ownership Conversion**: Single buyer acquiring all tokens receives NFT

#### 💸 Dividend System
- **Proportional Distribution**: USDC dividends split by ownership percentage
- **Batch Payments**: Single transaction distributes to all fractional owners
- **Automated Calculations**: Contract handles all proportional math
- **Admin Control**: Only admins can trigger distributions

#### 📊 Advanced Queries
- **Asset Display Info**: Complete asset details including fractional data
- **Available Assets**: Filter for verified, unsold properties
- **Fractionalized Assets**: List all assets with partial ownership
- **Buyer Portfolio**: Track all fractional investments with percentages
- **Seller Dashboard**: View all owned assets with status
- **Fractional Buyer Lists**: See all investors in a property with their stakes

### Security Features

- ✅ **ReentrancyGuard**: Protection on all financial functions
- ✅ **Access Control**: Owner and multi-admin role management
- ✅ **Custom Errors**: Gas-efficient error handling
- ✅ **Input Validation**: Comprehensive parameter checks
- ✅ **Safe Transfers**: OpenZeppelin's secure token transfer methods
- ✅ **Approval Checks**: Verify NFT and token approvals before operations
- ✅ **State Validation**: Prevent invalid state transitions

### Event System

All critical actions emit events for transparency and UI updates:

- `AssetCreated`, `AssetVerified`, `AssetDelisted`
- `AssetPurchased`, `AssetPaymentConfirmed`, `AssetCanceled`
- `FractionalAssetCreated`, `FractionalAssetPurchased`
- `FractionalDividendsDistributed`
- `SellerRegistered`, `USDCWithdrawn`

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                    RealEstateDApp                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   ERC721     │  │ ERC721Holder │  │ ReentrancyG  │  │
│  │ URIStorage   │  │              │  │    uard      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐                                       │
│  │   Ownable    │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ RealEstateToken │  │   USDC Token    │  │  Asset Metadata │
  │    (ERC-20)     │  │    (ERC-20)     │  │  (IPFS/HTTP)    │
  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Data Flow

#### Asset Listing Flow
```
Seller → registerSeller() → createAsset() → [Pending]
                                                 ↓
                                     Admin → verifyAsset()
                                                 ↓
                                           [Available]
                                           ↙         ↘
                                    buyAsset()  createFractionalAsset()
```

#### Full Purchase Flow
```
Buyer → buyAsset() → [USDC Locked]
           ↓
    confirmAssetPayment() → [NFT Transfer + Payment Distribution]
           OR
    cancelAssetPurchase() → [Refund - 1% Penalty]
```

#### Fractional Purchase Flow
```
Admin → createFractionalAsset() → [ERC-20 Tokens Minted]
                                          ↓
Multiple Buyers → buyFractionalAsset() → [Tokens Distributed]
                                          ↓
Admin → distributeFractionalDividends() → [USDC to All Owners]
```

### Contract Interactions

```mermaid
graph TD
    A[User/Seller] -->|Register| B[RealEstateDApp]
    A -->|Create Asset| B
    C[Admin] -->|Verify Asset| B
    D[Buyer] -->|Buy Asset| B
    B -->|Mint NFT| E[ERC721]
    B -->|Transfer USDC| F[USDC Contract]
    C -->|Fractionalize| B
    B -->|Mint Tokens| G[RealEstateToken]
    D -->|Buy Fractions| B
    B -->|Transfer Tokens| G
    C -->|Distribute Dividends| B
    B -->|Send USDC| F
```

## Smart Contracts

### RealEstateDApp.sol

**Main contract** handling all platform logic.

- **Inherits**: Ownable, ERC721URIStorage, ERC721Holder, ReentrancyGuard
- **Functions**: 30+ public/external functions
- **Events**: 10 distinct event types
- **Errors**: 20+ custom errors

**Key Constants:**
```solidity
LISTING_FEE_PERCENTAGE = 3          // 3% on sales
CANCELLATION_PENALTY_PERCENTAGE = 1 // 1% on cancellations
PERCENTAGE_SCALE = 1e18             // Precision for percentages
```

### RealEstateToken.sol

**ERC-20 token** for fractional ownership.

- **Standard**: ERC-20 (OpenZeppelin)
- **Minting**: Only RealEstateDApp can mint
- **Burning**: Not supported (prevent supply manipulation)
- **Decimals**: 18 (standard ERC-20)

### MockUSDC.sol (Testing Only)

**Mock USDC** for local development.

- **Standard**: ERC-20
- **Decimals**: 6 (matches real USDC)
- **Faucet**: Public mint function for testing

## Prerequisites

### Required Software

- **Node.js**: v20.0.0 or higher
- **npm**: v8.x or higher
- **Git**: Latest stable version
- **Ethereum Wallet**: MetaMask, Coinbase Wallet, or similar

### Development Tools

- **Hardhat**: v2.24.0
- **Solidity**: ^0.8.28
- **OpenZeppelin Contracts**: v4.9.0
- **Hardhat Toolbox**: v5.0.0

### Recommended IDE Setup

- **VS Code** with extensions:
  - Solidity by Juan Blanco
  - Hardhat Solidity
  - ESLint
  - Prettier

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/RealEstateDApp.git
cd RealEstateDApp
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Hardhat and plugins
- OpenZeppelin contracts
- Testing utilities (Chai, Waffle)
- Ethers.js

### 3. Verify Installation

```bash
npx hardhat --version
# Should output: Hardhat version 2.24.0
```

### 4. Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

 

## Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test File

```bash
npx hardhat test test/Test.js
```

### Run with Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

### Generate Coverage Report

```bash
npx hardhat coverage
````

### Key Test Coverage

- ✅ Seller registration and validation
- ✅ Asset creation and metadata
- ✅ Admin verification workflows
- ✅ Full asset purchase flow
- ✅ Purchase cancellation with penalties
- ✅ Fractional asset creation
- ✅ Fractional token purchases
- ✅ Fractional cancellations
- ✅ Dividend distribution calculations
- ✅ Asset delisting scenarios
- ✅ Access control enforcement
- ✅ Error handling and edge cases
- ✅ Gas optimization
- ✅ Reentrancy protection

## Deployment

### 1. Local Deployment (Hardhat Network)

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Testnet Deployment (Sepolia)

```bash
# Deploy to Sepolia
npx hardhat ignition deploy ignition/modules/POAPDapp.js --network testnet


### 3. Mainnet Deployment

```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

### Post-Deployment Checklist

- [ ] Verify all contracts on hashscan.io
- [ ] Test basic functions (register, create, verify)
- [ ] Add admin addresses
- [ ] Update frontend configuration
- [ ] Set up event monitoring
- [ ] Configure subgraph (if using The Graph)
- [ ] Test on testnet before mainnet
- [ ] Prepare incident response plan

## Usage Examples

### Seller Workflow

```javascript
const { ethers } = require("ethers");

// 1. Connect to contract
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, abi, signer);

// 2. Register as seller
await contract.registerSeller();

// 3. Create asset
const tx = await contract.createAsset(
  "ipfs://QmXYZ.../metadata.json",    // Token URI
  ethers.utils.parseUnits("100000", 6) // 100k USDC
);
await tx.wait();

// 4. Wait for verification (listen for event)
contract.on("AssetVerified", (tokenId, seller) => {
  console.log(`Asset ${tokenId} verified!`);
});

// 5. Check your assets
const myAssets = await contract.getSellerAssets(await signer.getAddress());
```

### Buyer Workflow

```javascript
// 1. Browse available assets
const availableAssets = await contract.fetchAvailableAssets();

// 2. Get asset details
const assetInfo = await contract.getAssetDisplayInfo(tokenId);

// 3. Approve USDC
const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
await usdcContract.approve(contract.address, assetInfo.price);

// 4. Purchase asset
await contract.buyAsset(tokenId);

// 5. Confirm payment
await contract.confirmAssetPayment(tokenId);
```

### Fractional Investment Workflow

```javascript
// 1. Find fractionalized assets
const fractionalAssets = await contract.fetchFractionalizedAssets();

// 2. Buy fractions
const numTokens = 100;
const asset = await contract.getAssetDisplayInfo(tokenId);
const cost = asset.pricePerFractionalToken * numTokens;

await usdcContract.approve(contract.address, cost);
await contract.buyFractionalAsset(tokenId, numTokens);

// 3. View portfolio
const portfolio = await contract.getBuyerPortfolio(userAddress);
console.log("My Investments:", portfolio);
```

### Admin Workflow

```javascript
// 1. Verify asset
await contract.verifyAsset(tokenId);

// 2. Create fractional asset
await contract.createFractionalAsset(tokenId, 10000); // 10k tokens

// 3. Distribute dividends
await contract.distributeFractionalDividends(
  tokenId,
  ethers.utils.parseUnits("5000", 6) // 5k USDC
);

// 4. Delist asset if needed
await contract.delistAsset(tokenId);
```

## Security

### Audit Status

⚠️ **This contract has not been audited.** Use at your own risk.

### Security Measures

1. **OpenZeppelin Contracts**: Industry-standard implementations
2. **ReentrancyGuard**: Applied to all financial functions
3. **Access Control**: Multi-level permission system
4. **Custom Errors**: Gas-efficient, clear error messages
5. **Input Validation**: Comprehensive parameter checks
6. **Safe Math**: Solidity 0.8+ built-in overflow protection

### Known Considerations

- **Admin Trust**: Admins have significant privileges (verify, fractionalize, delist)
- **USDC Dependency**: Contract relies on USDC contract availability
- **Gas Costs**: Large fractional buyer arrays can be expensive
- **Token URI Immutability**: Cannot change metadata after minting

### Best Practices for Users

1. **Verify Asset Details**: Always check metadata before purchasing
2. **Check Approvals**: Ensure proper USDC/NFT approvals
3. **Monitor Gas**: Use gas estimation for complex operations
4. **Confirm Transactions**: Wait for multiple confirmations on mainnet
5. **Backup Data**: Save transaction hashes and important addresses

## Gas Optimization

### Current Gas Costs (Approximate)

| Function | Gas Cost |
|----------|----------|
| `registerSeller()` | ~50,000 |
| `createAsset()` | ~200,000 |
| `verifyAsset()` | ~50,000 |
| `buyAsset()` | ~150,000 |
| `confirmAssetPayment()` | ~180,000 |
| `createFractionalAsset()` | ~250,000 |
| `buyFractionalAsset()` | ~120,000 |
| `distributeFractionalDividends()` | ~50,000 + (buyers * 30,000) |

### Optimization Strategies

1. **Use Specific Getters**: Avoid fetching all data then filtering
2. **Batch Operations**: Combine multiple reads with multicall
3. **Cache Constants**: Store immutable values in frontend
4. **Approve Once**: Use max approval to avoid repeated approvals
5. **Event Indexing**: Use indexed parameters for efficient filtering

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes and test thoroughly**
4. **Run linter**: `npm run lint`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

### Code Standards

- Follow Solidity style guide
- Add NatSpec comments for all functions
- Include unit tests for new features
- Maintain test coverage above 95%
- Update documentation for API changes

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements in production code
- [ ] Gas optimizations considered

## License

**UNLICENSED** - This project is proprietary and not licensed for public use, modification, or distribution without explicit permission.

## Contact

**Author**: Therock Ani

- **GitHub**: [@rocknwa](https://github.com/rocknwa)
- **Email**: anitherock44@gmail.com
- **Twitter**: [@ani_therock](https://twitter.com/ani_therock)

## Acknowledgments

- **OpenZeppelin**: For secure, audited smart contract libraries
- **Hardhat**: For excellent development environment
- **Ethereum Community**: For ongoing support and resources

---

**Last Updated**: January 2025

Deployed Addresses

ReaLiFiModule#MockUSDC - 0xfdE0f97F78A74E788E5Ea61e91D8cEAB396A5f95
ReaLiFiModule#RealifiFractionalToken - 0xA53860Ff96067c0632fB498bf777807D8B55Da8a
ReaLiFiModule#ReaLiFi - 0x356edA5558641C70E39fA4920B63d88Bcc12b1C2