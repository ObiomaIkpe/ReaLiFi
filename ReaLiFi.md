# ReaLiFi Smart Contract Documentation

## Overview

**ReaLiFi** is a comprehensive Solidity smart contract for a decentralized real estate marketplace built on Hedera. It enables sellers to tokenize real estate assets as NFTs (ERC-721), fractionalize them into ERC-20 tokens for shared ownership, trade shares on a secondary market, and handle all payments in USDC. The contract includes robust security features, admin controls, dividend distribution capabilities, and a complete share trading ecosystem.

**Version:** Solidity ^0.8.28  
**Author:** Therock Ani  
**License:** UNLICENSED

---

## Table of Contents

1. [Key Features](#key-features)
2. [Architecture & Design](#architecture--design)
3. [Core Concepts](#core-concepts)
4. [Contract Constants](#contract-constants)
5. [State Variables](#state-variables)
6. [Data Structures](#data-structures)
7. [Access Control](#access-control)
8. [Functions Reference](#functions-reference)
9. [Events](#events)
10. [Error Handling](#error-handling)
11. [Integration Guide](#integration-guide)
12. [Security Considerations](#security-considerations)
13. [Gas Optimization](#gas-optimization)

---

## Key Features

### Core Capabilities
- ✅ **NFT-Based Asset Representation:** Each real estate asset is a unique ERC-721 token with metadata and URI
- ✅ **Fractional Ownership:** Assets can be divided into ERC-20 tokens for multiple investors
- ✅ **Secondary Market Trading:** Buy and sell fractional shares on the platform marketplace
- ✅ **Peer-to-Peer Transfers:** Direct share transfers between users off-platform
- ✅ **USDC Payments:** All transactions use USDC stablecoin for price stability
- ✅ **Admin Verification System:** Multi-admin support for asset verification and management
- ✅ **Dividend Distribution:** Automated proportional dividend distribution to fractional owners
- ✅ **Controlled Withdrawals:** Admin-managed withdrawal permissions for fractional investments
- ✅ **Purchase Workflow:** Complete lifecycle including listing, payment, confirmation, and cancellation
- ✅ **Seller Registration:** Mandatory seller registration before listing assets
- ✅ **Portfolio Tracking:** Comprehensive portfolio views for buyers and sellers
- ✅ **Security Features:** ReentrancyGuard, custom errors, and access control

---

## Architecture & Design

### Contract Inheritance

```
RealEstateDApp
    ├── Ownable (OpenZeppelin)
    ├── ERC721URIStorage (OpenZeppelin)
    ├── ERC721Holder (OpenZeppelin)
    └── ReentrancyGuard (OpenZeppelin)
```

### External Dependencies

- **RealifiFractionalTokens:** Custom ERC-20 token for fractional ownership
- **USDC Token:** ERC-20 stablecoin interface for payments
- **OpenZeppelin Contracts v4.x:** Battle-tested security and token standards

### Design Patterns

- **Factory Pattern:** Assets and fractional shares created on-demand
- **State Machine:** Asset lifecycle management (created → verified → sold/fractionalized)
- **Pull Payment:** Buyers initiate payment, sellers confirm to receive funds
- **Escrow Pattern:** Shares held in contract during marketplace listings
- **Access Control:** Owner and multi-admin roles for privileged operations

---

## Core Concepts

### 1. Asset Lifecycle

```
Create Asset → Admin Verification → (Purchase OR Fractionalize) → Sold/Distributed
     ↓                                        ↓                         ↓
  Pending                            Available for Sale          Ownership Transfer
                                              ↓
                                    Secondary Market Trading
```

**States:**
- **Created:** Asset listed but not verified
- **Verified:** Admin-approved, ready for sale/fractionalization
- **Paid:** Buyer has paid, awaiting confirmation
- **Sold:** Ownership transferred, transaction complete
- **Canceled:** Purchase canceled, funds refunded
- **Delisted:** Removed from marketplace by admin

### 2. Full Asset Purchase Flow

1. **Buyer calls `buyAsset(tokenId)`**
   - USDC transferred to contract
   - Asset marked as "paid"
   - Buyer address recorded

2. **Buyer calls `confirmAssetPayment(tokenId)`**
   - 3% listing fee deducted
   - Remaining USDC sent to seller
   - NFT transferred to buyer
   - Asset marked as "sold"

3. **Alternative: Buyer calls `cancelAssetPurchase(tokenId)`**
   - 1% cancellation penalty deducted
   - Remaining USDC refunded to buyer
   - Asset returns to available status

### 3. Fractional Ownership

**How It Works:**
- Admin calls `createFractionalAsset(tokenId, totalTokens)`
- Asset price divided by total tokens = price per token
- ERC-20 tokens minted and held by contract
- Buyers purchase fractions via `buyFractionalAsset(tokenId, numTokens)`
- If one buyer acquires all tokens → receives NFT
- Fractional buyers can withdraw (if admin allows) or sell on secondary market

**Ownership Tracking:**
- Each buyer's token count stored in `buyerFractions` mapping
- Percentage calculated as: `(tokens_owned * 100 * 1e18) / total_tokens`
- List of all buyers maintained in `fractionalAssetBuyers` array

### 4. Secondary Market Trading

**Share Trading Options:**

**Option A: Direct P2P Transfer (No Fees)**
- Call `transferShares(tokenId, recipient, numShares)`
- Immediate transfer, no platform involvement
- Use case: Gifts, private sales, off-platform transactions

**Option B: Platform Marketplace (2% Fee)**
- Seller lists shares: `listSharesForSale(tokenId, numShares, pricePerShare)`
- Shares held in escrow by contract
- Buyer purchases: `buyListedShares(listingId)`
- 2% fee deducted, seller receives 98%
- Can cancel listing: `cancelShareListing(listingId)`

**Benefits:**
- Provides liquidity for fractional investors
- Price discovery through market dynamics
- Alternative to withdrawal restrictions

### 5. Controlled Withdrawals

- Admin sets withdrawal permissions via `setBuyerCanWithdraw(tokenId, true/false)`
- Prevents capital flight during critical periods
- Buyers can always trade on secondary market as alternative
- Partial withdrawals supported: `cancelFractionalAssetPurchase(tokenId, numTokens)`

### 6. Dividend Distribution

- Admin deposits USDC for dividends via `distributeFractionalDividends(tokenId, amount)`
- Contract calculates proportional shares for each fractional owner
- USDC automatically transferred to all fractional buyers
- Any rounding dust returned to contract

---

## Contract Constants

```solidity
uint256 public constant LISTING_FEE_PERCENTAGE = 3;          // 3% fee on full asset sales
uint256 public constant CANCELLATION_PENALTY_PERCENTAGE = 1;  // 1% penalty on cancellations
uint256 public constant SHARE_TRADING_FEE_PERCENTAGE = 2;    // 2% fee on secondary share trades
uint256 private constant PERCENTAGE_DENOMINATOR = 100;
uint256 private constant PERCENTAGE_SCALE = 1e18;            // For precise percentage calculations
uint256 private constant START_TOKEN_ID = 1;
uint256 private constant ZERO_AMOUNT = 0;
address private constant ZERO_ADDRESS = address(0);
```

**Fee Structure:**
- **Listing Fee:** 3% deducted from seller's payment on confirmed full asset sales
- **Cancellation Penalty:** 1% charged to buyer if they cancel a full asset purchase
- **Share Trading Fee:** 2% charged to buyer on secondary market share purchases
- All fees sent to contract owner

---

## State Variables

### Public State

```solidity
uint256 private _tokenIds;                                    // Counter for NFT token IDs
uint256 private _shareListingIds;                             // Counter for share listing IDs
RealEstateToken public immutable realEstateToken;            // ERC-20 for fractions
IERC20 public immutable usdcToken;                           // Payment token

// Direct UI access mappings
mapping(uint256 => RealEstateAsset) public realEstateAssets; // tokenId → asset details
mapping(address => bool) public sellers;                      // Registered sellers
mapping(uint256 => FractionalAsset) public fractionalAssets; // tokenId → fractional details
mapping(address => bool) public isAdmin;                      // Admin addresses
mapping(uint256 => ShareListing) public shareListings;       // listingId → share listing
mapping(uint256 => bool) public buyerCanWithdraw;            // tokenId → withdrawal permission
```

### Private State (with Getters)

```solidity
mapping(address => uint256) private sellerConfirmedPurchases;  // Seller success metrics
mapping(address => uint256) private sellerCanceledPurchases;   // Seller cancellation metrics
mapping(uint256 => bool) private assetPaidFor;                 // Payment status
mapping(uint256 => address payable) private assetBuyers;       // Pending buyers
mapping(uint256 => bool) private assetCanceled;                // Cancellation status
mapping(address => mapping(uint256 => uint256)) private buyerFractions; // User → tokenId → tokens
mapping(uint256 => address[]) private fractionalAssetBuyers;   // All fractional buyers per asset
mapping(uint256 => uint256) private fractionalPayments;        // Accumulated USDC from fractions
mapping(uint256 => uint256[]) private assetShareListings;      // tokenId → array of listingIds
```

---

## Data Structures

### RealEstateAsset

Primary structure for each listed property.

```solidity
struct RealEstateAsset {
    uint256 tokenId;           // Unique NFT identifier
    uint256 price;             // Total price in USDC (with 6 decimals)
    address payable seller;    // Current owner/seller
    bool sold;                 // Sale completion status
    bool verified;             // Admin verification status
}
```

### FractionalAsset

Tracks fractionalization details for an asset.

```solidity
struct FractionalAsset {
    uint256 tokenId;           // Reference to parent NFT
    uint256 totalTokens;       // Remaining unsold fractional tokens
    uint256 pricePerToken;     // USDC price per fraction
    address payable seller;    // Original seller
}
```

### FractionalBuyer

Represents a fractional owner's stake.

```solidity
struct FractionalBuyer {
    address buyer;             // Buyer's wallet address
    uint256 numTokens;         // Number of tokens owned
    uint256 percentage;        // Ownership percentage (scaled by 1e18)
}
```

### ShareListing

Represents a secondary market listing for fractional shares.

```solidity
struct ShareListing {
    uint256 listingId;         // Unique listing identifier
    uint256 tokenId;           // Reference to parent NFT asset
    address seller;            // Address selling the shares
    uint256 numShares;         // Number of shares being sold
    uint256 pricePerShare;     // USDC price per share
    bool active;               // Listing status
}
```

### AssetDisplayInfo

Extended information for UI rendering.

```solidity
struct AssetDisplayInfo {
    uint256 tokenId;
    uint256 price;
    address seller;
    bool sold;
    bool verified;
    bool isPaidFor;
    bool isCanceled;
    address currentBuyer;
    string tokenURI;
    bool isFractionalized;
    uint256 totalFractionalTokens;
    uint256 remainingFractionalTokens;
    uint256 pricePerFractionalToken;
    uint256 accumulatedFractionalPayments;
}
```

### BuyerPortfolio

User's fractional investment summary.

```solidity
struct BuyerPortfolio {
    uint256 tokenId;                    // Asset identifier
    uint256 fractionalTokensOwned;      // Token count
    uint256 ownershipPercentage;        // Ownership % (scaled by 1e18)
    uint256 investmentValue;            // Total USDC invested
}
```

---

## Access Control

### Roles & Permissions

| Role | Functions | Description |
|------|-----------|-------------|
| **Owner** | `addAdmin`, `removeAdmin`, `withdrawUSDC` | Contract deployer, highest authority |
| **Admin** | `verifyAsset`, `delistAsset`, `createFractionalAsset`, `distributeFractionalDividends`, `setBuyerCanWithdraw` | Trusted operators for asset management |
| **Seller** | `createAsset`, `listSharesForSale`, `cancelShareListing` | Registered users who can list properties and sell shares |
| **Buyer** | `buyAsset`, `buyFractionalAsset`, `confirmAssetPayment`, `cancelAssetPurchase`, `cancelFractionalAssetPurchase`, `buyListedShares` | Any wallet can purchase |
| **Share Holder** | `transferShares`, `listSharesForSale`, `cancelShareListing` | Fractional owners can trade their shares |

### Modifiers

```solidity
modifier onlyAdmin {
    if(!isAdmin[msg.sender]) revert NotAdmin(msg.sender);
    _;
}
```

- `onlyOwner`: Inherited from OpenZeppelin Ownable
- `onlyAdmin`: Custom modifier for admin-only functions
- `nonReentrant`: Applied to all state-changing financial functions

---

## Functions Reference

### Seller Management

#### `registerSeller()`

Registers caller as a seller.

```solidity
function registerSeller() public
```

**Requirements:**
- Caller not already registered

**Effects:**
- Sets `sellers[msg.sender] = true`
- Emits `SellerRegistered(msg.sender)`

**Errors:**
- `SellerAlreadyRegistered()`

---

#### `addAdmin(address _admin)`

Grants admin privileges to an address.

```solidity
function addAdmin(address _admin) external onlyOwner
```

**Parameters:**
- `_admin`: Address to grant admin role

**Requirements:**
- Caller must be contract owner

**Effects:**
- Sets `isAdmin[_admin] = true`

---

#### `removeAdmin(address _admin)`

Revokes admin privileges from an address.

```solidity
function removeAdmin(address _admin) external onlyOwner
```

**Parameters:**
- `_admin`: Address to revoke admin role

**Requirements:**
- Caller must be contract owner

**Effects:**
- Sets `isAdmin[_admin] = false`

---

### Asset Listing & Management

#### `createAsset(string memory _tokenURI, uint256 _price)`

Lists a new real estate asset as an NFT.

```solidity
function createAsset(string memory _tokenURI, uint256 _price) public
```

**Parameters:**
- `_tokenURI`: IPFS or HTTP URL pointing to asset metadata (JSON)
- `_price`: Total price in USDC (e.g., 1000000 for 1 USDC with 6 decimals)

**Requirements:**
- Caller must be registered seller
- Price must be greater than zero

**Effects:**
- Mints new NFT to seller
- Increments `_tokenIds`
- Creates `RealEstateAsset` entry
- Auto-approves contract to manage NFT
- Emits `AssetCreated(tokenId, price, seller, false)`

**Errors:**
- `SellerNotRegistered()`
- `InvalidPrice()`

**Example:**
```javascript
await contract.createAsset(
    "ipfs://QmXYZ.../metadata.json",
    ethers.utils.parseUnits("100000", 6) // 100k USDC
);
```

---

#### `verifyAsset(uint256 tokenId)`

Marks an asset as admin-verified and eligible for sale.

```solidity
function verifyAsset(uint256 tokenId) public onlyAdmin
```

**Parameters:**
- `tokenId`: ID of asset to verify

**Requirements:**
- Caller must be admin
- Asset must exist
- Asset not already verified

**Effects:**
- Sets `realEstateAssets[tokenId].verified = true`
- Emits `AssetVerified(tokenId, seller)`

**Errors:**
- `NotAdmin(msg.sender)`
- `AssetDoesNotExist()`
- `AssetAlreadyVerified()`

---

#### `delistAsset(uint256 tokenId)`

Removes an asset from the marketplace.

```solidity
function delistAsset(uint256 tokenId) public onlyAdmin nonReentrant
```

**Parameters:**
- `tokenId`: ID of asset to delist

**Requirements:**
- Caller must be admin
- Asset must exist
- Asset not already sold
- No fractional buyers (cannot delist if fractionalized with buyers)

**Effects:**
- If asset has pending buyer: refunds full USDC, marks as canceled
- Removes contract approval
- Deletes asset from `realEstateAssets`
- Emits `AssetDelisted(tokenId, seller)`

**Errors:**
- `NotAdmin(msg.sender)`
- `AssetDoesNotExist()`
- `AssetAlreadySold()`
- `FractionalizedAssetWithBuyers()`
- `USDCTransferFailed()`

**Important:** This function will increment the seller's canceled purchases counter if there was a pending buyer.

---

### Asset Purchase (Full Ownership)

#### `buyAsset(uint256 tokenId)`

Initiates purchase of a full asset.

```solidity
function buyAsset(uint256 tokenId) public
```

**Parameters:**
- `tokenId`: ID of asset to purchase

**Requirements:**
- Asset must be verified
- Asset not sold
- Asset not already paid for
- Buyer is not the seller
- Seller still owns NFT
- Contract approved to transfer NFT
- Buyer has approved USDC spending

**Effects:**
- Transfers full USDC price to contract
- Sets `assetPaidFor[tokenId] = true`
- Records buyer in `assetBuyers[tokenId]`
- Emits `AssetPurchased(tokenId, buyer, price)`

**Errors:**
- `AssetAlreadySold()`
- `NotBuyer()`
- `AssetAlreadyPaid()`
- `AssetNotVerified()`
- `SellerNotOwner()`
- `ContractNotApproved()`
- `USDCTransferFailed()`

**Flow:**
1. Buyer calls `buyAsset(tokenId)`
2. USDC locked in contract
3. Buyer calls `confirmAssetPayment(tokenId)` to finalize OR `cancelAssetPurchase(tokenId)` to cancel

---

#### `confirmAssetPayment(uint256 tokenId)`

Completes asset purchase and transfers ownership.

```solidity
function confirmAssetPayment(uint256 tokenId) public nonReentrant
```

**Parameters:**
- `tokenId`: ID of asset to confirm

**Requirements:**
- Caller must be the pending buyer
- Asset must be paid for
- Asset not yet sold
- Asset must be verified
- Seller still owns NFT
- Contract approved to transfer NFT

**Effects:**
- Deducts 3% listing fee
- Transfers remaining USDC to seller
- Transfers listing fee to owner
- Transfers NFT to buyer
- Marks asset as sold
- Increments seller's confirmed purchases counter
- Emits `AssetPaymentConfirmed(tokenId, buyer)`

**Errors:**
- `NotBuyer()`
- `AssetNotPaid()`
- `AssetAlreadySold()`
- `AssetNotVerified()`
- `SellerNotOwner()`
- `ContractNotApproved()`
- `USDCTransferFailed()`

**Fee Calculation:**
```javascript
listingFee = price * 3 / 100
sellerReceives = price - listingFee
```

---

#### `cancelAssetPurchase(uint256 tokenId)`

Cancels a pending asset purchase.

```solidity
function cancelAssetPurchase(uint256 tokenId) public nonReentrant
```

**Parameters:**
- `tokenId`: ID of asset to cancel

**Requirements:**
- Caller must be the pending buyer
- Asset must be paid for
- Asset not yet sold

**Effects:**
- Deducts 1% cancellation penalty
- Refunds remaining USDC to buyer
- Transfers penalty to owner
- Marks asset as canceled
- Increments seller's canceled purchases counter
- Clears payment and buyer records
- Emits `AssetCanceled(tokenId, buyer)`

**Errors:**
- `NotBuyer()`
- `AssetNotPaid()`
- `AssetAlreadySold()`
- `USDCTransferFailed()`

**Penalty Calculation:**
```javascript
penalty = price * 1 / 100
buyerRefund = price - penalty
```

---

### Share Trading & Transfer

#### `transferShares(uint256 tokenId, address to, uint256 numShares)`

Transfers fractional shares directly to another address (off-platform transfer).

```solidity
function transferShares(uint256 tokenId, address to, uint256 numShares) public nonReentrant
```

**Parameters:**
- `tokenId`: ID of the fractionalized asset
- `to`: Recipient address
- `numShares`: Number of shares to transfer

**Requirements:**
- Recipient must not be zero address
- Recipient must not be sender
- `numShares > 0`
- Sender must own at least `numShares`
- Asset must be fractionalized

**Effects:**
- Decrements sender's `buyerFractions`
- Increments recipient's `buyerFractions`
- Adds recipient to `fractionalAssetBuyers` if first purchase
- Transfers ERC-20 tokens from sender to recipient
- Emits `SharesTransferred(tokenId, from, to, numShares)`

**Errors:**
- `InvalidRecipient()`
- `InvalidAmount()`
- `NotEnoughTokensOwned()`
- `FractionalAssetDoesNotExist()`

**Use Case:** Direct P2P transfers outside the marketplace (e.g., gifts, private sales)

**Example:**
```javascript
await contract.transferShares(tokenId, recipientAddress, 50);
```

---

#### `listSharesForSale(uint256 tokenId, uint256 numShares, uint256 pricePerShare)`

Lists fractional shares for sale on the platform marketplace.

```solidity
function listSharesForSale(uint256 tokenId, uint256 numShares, uint256 pricePerShare) public nonReentrant
```

**Parameters:**
- `tokenId`: ID of the fractionalized asset
- `numShares`: Number of shares to list
- `pricePerShare`: USDC price per share

**Requirements:**
- `numShares > 0`
- `pricePerShare > 0`
- Seller must own at least `numShares`
- Asset must be fractionalized
- Seller must approve contract to transfer ERC-20 tokens

**Effects:**
- Transfers shares to contract (escrow)
- Increments `_shareListingIds`
- Creates `ShareListing` entry
- Adds listing ID to `assetShareListings`
- Emits `SharesListed(listingId, tokenId, seller, numShares, pricePerShare)`

**Errors:**
- `InvalidAmount()`
- `InvalidPrice()`
- `NotEnoughTokensOwned()`
- `FractionalAssetDoesNotExist()`

**Important:** Shares are held in escrow by the contract until listing is bought or canceled.

**Example:**
```javascript
// First approve the contract to transfer ERC-20 tokens
await realEstateTokenContract.approve(
    contractAddress,
    ethers.utils.parseUnits("50", 18)
);

// List 50 shares at 100 USDC each
await contract.listSharesForSale(
    tokenId,
    50,
    ethers.utils.parseUnits("100", 6)
);
```

---

#### `buyListedShares(uint256 listingId)`

Purchases shares from a marketplace listing.

```solidity
function buyListedShares(uint256 listingId) public nonReentrant
```

**Parameters:**
- `listingId`: ID of the share listing to purchase

**Requirements:**
- Listing must exist
- Listing must be active
- Buyer cannot be the seller
- Buyer must have approved USDC spending

**Effects:**
- Calculates 2% trading fee
- Transfers total USDC from buyer to contract
- Transfers (price - fee) to seller
- Transfers fee to contract owner
- Decrements seller's `buyerFractions`
- Increments buyer's `buyerFractions`
- Adds buyer to `fractionalAssetBuyers` if first purchase
- Transfers shares from escrow to buyer
- Deactivates listing
- Emits `SharesPurchased(listingId, tokenId, buyer, seller, numShares, totalPrice)`

**Errors:**
- `ShareListingNotFound()`
- `ShareListingNotActive()`
- `CannotBuyOwnShares()`
- `USDCTransferFailed()`

**Fee Calculation:**
```javascript
tradingFee = totalPrice * 2 / 100
sellerReceives = totalPrice - tradingFee
```

**Example:**
```javascript
// Approve USDC
const listing = await contract.shareListings(listingId);
const totalCost = listing.numShares.mul(listing.pricePerShare);
await usdcContract.approve(contractAddress, totalCost);

// Buy shares
await contract.buyListedShares(listingId);
```

---

#### `cancelShareListing(uint256 listingId)`

Cancels an active share listing and returns shares to seller.

```solidity
function cancelShareListing(uint256 listingId) public nonReentrant
```

**Parameters:**
- `listingId`: ID of the share listing to cancel

**Requirements:**
- Listing must exist
- Caller must be the listing seller
- Listing must be active

**Effects:**
- Returns shares from escrow to seller
- Deactivates listing
- Emits `ShareListingCanceled(listingId, tokenId, seller)`

**Errors:**
- `ShareListingNotFound()`
- `NotShareSeller()`
- `ShareListingNotActive()`

**Example:**
```javascript
await contract.cancelShareListing(listingId);
```

---

### Fractional Ownership

#### `createFractionalAsset(uint256 tokenId, uint256 totalTokens)`

Splits an asset into fractional ERC-20 tokens.

```solidity
function createFractionalAsset(uint256 tokenId, uint256 totalTokens) public onlyAdmin
```

**Parameters:**
- `tokenId`: ID of asset to fractionalize
- `totalTokens`: Number of fractional tokens to create

**Requirements:**
- Caller must be admin
- Asset must exist and be verified
- Asset not sold
- Seller still owns NFT
- Contract approved to manage NFT

**Effects:**
- Calculates `pricePerToken = price / totalTokens`
- Creates `FractionalAsset` entry
- Mints ERC-20 tokens to contract
- Emits `FractionalAssetCreated(tokenId, totalTokens, pricePerToken, seller)`

**Errors:**
- `NotAdmin(msg.sender)`
- `AssetDoesNotExist()`
- `AssetAlreadySold()`
- `AssetNotVerified()`
- `SellerNotOwner()`
- `ContractNotApproved()`

**Example:**
```javascript
// Asset priced at 100,000 USDC
// Create 10,000 fractional tokens
// Each token = 10 USDC
await contract.createFractionalAsset(tokenId, 10000);
```

---

#### `buyFractionalAsset(uint256 tokenId, uint256 numTokens)`

Purchases fractional tokens of an asset.

```solidity
function buyFractionalAsset(uint256 tokenId, uint256 numTokens) public nonReentrant
```

**Parameters:**
- `tokenId`: ID of fractionalized asset
- `numTokens`: Number of tokens to purchase

**Requirements:**
- `numTokens > 0`
- Sufficient tokens available
- Buyer has approved USDC spending

**Effects:**
- Transfers USDC to contract
- Decrements `fractionalAsset.totalTokens`
- Increments `buyerFractions[buyer][tokenId]`
- Transfers ERC-20 tokens to buyer
- Adds buyer to `fractionalAssetBuyers` list (first purchase only)
- If buyer acquires all tokens: marks asset as sold, transfers NFT
- Emits `FractionalAssetPurchased(tokenId, buyer, numTokens, totalPrice)`

**Errors:**
- `InvalidAmount()`
- `InsufficientTokens()`
- `USDCTransferFailed()`

**Special Case:**
If a single buyer acquires 100% of fractional tokens:
- Asset marked as `sold = true`
- NFT transferred from seller to buyer
- Buyer now owns both ERC-20 tokens AND the NFT

---

#### `cancelFractionalAssetPurchase(uint256 tokenId, uint256 numTokens)`

Refunds fractional tokens back to contract (partial or full withdrawal).

```solidity
function cancelFractionalAssetPurchase(uint256 tokenId, uint256 numTokens) public nonReentrant
```

**Parameters:**
- `tokenId`: ID of fractionalized asset
- `numTokens`: Number of tokens to withdraw

**Requirements:**
- Admin must have enabled withdrawals via `setBuyerCanWithdraw`
- Caller must own tokens for this asset
- Caller must own at least `numTokens`
- Caller has approved ERC-20 transfer back to contract

**Effects:**
- Calculates refund amount for `numTokens`
- Increments `fractionalAsset.totalTokens` (returns tokens to pool)
- Decrements `buyerFractions[buyer][tokenId]` by `numTokens`
- Decrements `fractionalPayments[tokenId]`
- Transfers ERC-20 tokens back to contract
- Refunds USDC to buyer
- Emits `AssetCanceled(tokenId, buyer)`

**Errors:**
- `CannotWithdrawYet()`
- `NoTokensOwned()`
- `NotEnoughTokensOwned()`
- `USDCTransferFailed()`

**Note:** Withdrawals are controlled by admin to prevent market manipulation during critical periods. Buyers can also sell shares on the secondary market via `listSharesForSale`.

---

### Dividend Distribution

#### `distributeFractionalDividends(uint256 tokenId, uint256 amount)`

Distributes USDC dividends to all fractional owners.

```solidity
function distributeFractionalDividends(uint256 tokenId, uint256 amount) public onlyAdmin nonReentrant
```

**Parameters:**
- `tokenId`: ID of fractionalized asset
- `amount`: Total USDC to distribute

**Requirements:**
- Caller must be admin
- Asset must be fractionalized
- Amount must be greater than zero
- Contract must have sufficient USDC balance

**Effects:**
- Calculates each buyer's proportional share
- Transfers USDC to all fractional buyers
- Any rounding remainder stays in contract
- Emits `FractionalDividendsDistributed(tokenId, amount, buyers[], amounts[])`

**Errors:**
- `NotAdmin(msg.sender)`
- `FractionalAssetDoesNotExist()`
- `InvalidAmount()`
- `InsufficientUSDCBalance()`
- `NoTokensIssued()`
- `USDCTransferFailed()`

**Calculation:**
```javascript
totalTokens = asset fully sold ? 
    (price / pricePerToken) : 
    (remainingTokens + sum of all buyer tokens)

buyerShare = (amount * buyerTokens) / totalTokens
```

**Example:**
```javascript
// Distribute 5000 USDC in rental income
await contract.distributeFractionalDividends(tokenId, 
    ethers.utils.parseUnits("5000", 6)
);
```

---

#### `setBuyerCanWithdraw(uint256 tokenId, bool canWithdraw)`

Controls whether fractional buyers can withdraw their investments.

```solidity
function setBuyerCanWithdraw(uint256 tokenId, bool canWithdraw) public onlyAdmin
```

**Parameters:**
- `tokenId`: ID of fractionalized asset
- `canWithdraw`: Whether to allow withdrawals

**Requirements:**
- Caller must be admin

**Effects:**
- Sets `buyerCanWithdraw[tokenId]` flag

**Use Cases:**
- **Disable withdrawals** during critical fundraising periods to ensure capital stability
- **Enable withdrawals** when asset is fully funded or during exit windows
- Manage liquidity and prevent bank runs

**Example:**
```javascript
// Enable withdrawals for an asset
await contract.setBuyerCanWithdraw(tokenId, true);

// Disable withdrawals
await contract.setBuyerCanWithdraw(tokenId, false);
```

---

### Utility Functions

#### `withdrawUSDC(address recipient, uint256 amount)`

Withdraws USDC from contract balance.

```solidity
function withdrawUSDC(address recipient, uint256 amount) public onlyOwner nonReentrant
```

**Parameters:**
- `recipient`: Address to receive USDC
- `amount`: USDC amount to withdraw

**Requirements:**
- Caller must be owner
- Recipient must not be zero address
- Amount must be greater than zero
- Contract must have sufficient balance

**Effects:**
- Transfers USDC to recipient
- Emits `USDCWithdrawn(recipient, amount)`

**Errors:**
- `InvalidRecipient()`
- `InvalidAmount()`
- `InsufficientUSDCBalance()`
- `USDCTransferFailed()`

**Use Cases:**
- Withdraw accumulated listing fees
- Withdraw cancellation penalties
- Withdraw share trading fees
- Emergency USDC recovery

---

### Getter Functions

#### Asset & State Queries

```solidity
// Basic asset info
function fetchAsset(uint256 tokenId) public view returns (RealEstateAsset memory)

// All listed assets
function fetchAllListedAssets() public view returns (RealEstateAsset[] memory)

// Only unsold assets
function fetchUnsoldAssets() public view returns (RealEstateAsset[] memory)
```

#### Extended Display Info

```solidity
// Complete asset information for UI
function getAssetDisplayInfo(uint256 tokenId) public view returns (AssetDisplayInfo memory)

// All assets with full details
function fetchAllAssetsWithDisplayInfo() public view returns (AssetDisplayInfo[] memory)

// Only verified and unsold assets
function fetchAvailableAssets() public view returns (AssetDisplayInfo[] memory)

// Only fractionalized assets
function fetchFractionalizedAssets() public view returns (AssetDisplayInfo[] memory)

// Assets owned by specific seller
function getSellerAssets(address seller) public view returns (AssetDisplayInfo[] memory)
```

#### Fractional Ownership Queries

```solidity
// Buyer's fractional tokens for asset
function getBuyerFractions(address buyer, uint256 tokenId) public view returns (uint256)

// All fractional buyers for asset
function getFractionalAssetBuyersList(uint256 tokenId) public view returns (address[] memory)

// Detailed buyer list with percentages
function fetchFractionalAssetBuyers(uint256 tokenId) public view returns (FractionalBuyer[] memory)

// Accumulated USDC from fractional sales
function getFractionalPayments(uint256 tokenId) public view returns (uint256)

// Buyer's complete portfolio
function getBuyerPortfolio(address buyer) public view returns (BuyerPortfolio[] memory)

// Get all active share listings for a specific asset
function getAssetShareListings(uint256 tokenId) public view returns (ShareListing[] memory)

// Get all active share listings across all assets
function getAllActiveShareListings() public view returns (ShareListing[] memory)
```

#### Payment & Status Queries

```solidity
// Check if asset is paid for
function isAssetPaidFor(uint256 tokenId) public view returns (bool)

// Get pending buyer address
function getAssetBuyer(uint256 tokenId) public view returns (address)

// Check if purchase was canceled
function isAssetCanceled(uint256 tokenId) public view returns (bool)

// Get seller's confirmed/canceled purchase counts
function getSellerMetrics(address sellerAddress) public view returns (uint256 confirmed, uint256 canceled)
```

---

## Events

### Asset Events

```solidity
event AssetCreated(
    uint256 indexed tokenId,
    uint256 price,
    address indexed seller,
    bool verified
);

event AssetVerified(
    uint256 indexed tokenId,
    address indexed seller
);

event AssetDelisted(
    uint256 indexed tokenId,
    address indexed seller
);

event AssetPurchased(
    uint256 indexed tokenId,
    address indexed buyer,
    uint256 price
);

event AssetPaymentConfirmed(
    uint256 indexed tokenId,
    address indexed buyer
);

event AssetCanceled(
    uint256 indexed tokenId,
    address indexed buyer
);
```

### Fractional Events

```solidity
event FractionalAssetCreated(
    uint256 indexed tokenId,
    uint256 totalTokens,
    uint256 pricePerToken,
    address indexed seller
);

event FractionalAssetPurchased(
    uint256 indexed tokenId,
    address indexed buyer,
    uint256 numTokens,
    uint256 totalPrice
);

event FractionalDividendsDistributed(
    uint256 indexed tokenId,
    uint256 totalAmount,
    address[] buyers,
    uint256[] amounts
);

event SharesTransferred(
    uint256 indexed tokenId,
    address indexed from,
    address indexed to,
    uint256 numShares
);

event SharesListed(
    uint256 indexed listingId,
    uint256 indexed tokenId,
    address indexed seller,
    uint256 numShares,
    uint256 pricePerShare
);

event SharesPurchased(
    uint256 indexed listingId,
    uint256 indexed tokenId,
    address indexed buyer,
    address seller,
    uint256 numShares,
    uint256 totalPrice
);

event ShareListingCanceled(
    uint256 indexed listingId,
    uint256 indexed tokenId,
    address indexed seller
);
```

### Administrative Events

```solidity
event SellerRegistered(
    address indexed sellerAddress
);

event USDCWithdrawn(
    address indexed recipient,
    uint256 amount
);
```

---

## Error Handling

### Custom Errors

The contract uses custom errors for gas efficiency and clear error messaging.

#### Seller Errors
```solidity
error SellerAlreadyRegistered();
error SellerNotRegistered();
error SellerNotOwner();
```

#### Asset Errors
```solidity
error AssetDoesNotExist();
error AssetAlreadyVerified();
error AssetAlreadySold();
error AssetNotVerified();
error AssetAlreadyPaid();
error AssetNotPaid();
```

#### Fractional Errors
```solidity
error FractionalAssetDoesNotExist();
error FractionalizedAssetWithBuyers();
error InsufficientTokens();
error NoTokensOwned();
error NoTokensIssued();
error NotEnoughTokensOwned();
error ShareListingNotFound();
error ShareListingNotActive();
error NotShareSeller();
error CannotBuyOwnShares();
error CannotWithdrawYet();
```

#### Payment Errors
```solidity
error InvalidPrice();
error InvalidAmount();
error InvalidRecipient();
error InsufficientUSDCBalance();
error USDCTransferFailed();
```

#### Access Control Errors
```solidity
error NotAdmin(address caller);
error NotBuyer();
error ContractNotApproved();
```

### Error Handling Best Practices

**For Front-End Developers:**

```javascript
try {
    await contract.createAsset(tokenURI, price);
} catch (error) {
    if (error.message.includes("SellerNotRegistered")) {
        alert("Please register as a seller first");
    } else if (error.message.includes("InvalidPrice")) {
        alert("Price must be greater than zero");
    } else {
        console.error("Transaction failed:", error);
    }
}
```

---

## Integration Guide

### Prerequisites

1. **Contract Addresses:**
   - RealEstateDApp: `[your deployed address]`
   - RealEstateToken (ERC-20): `[token address]`
   - USDC: `[network-specific USDC address]`

2. **Network Configuration:**
   - Ethereum Mainnet / Testnet / L2
   - RPC endpoint
   - Chain ID

3. **Dependencies:**
   ```bash
   npm install ethers@5 @openzeppelin/contracts
   ```

### Setup Guide

#### 1. Connect to Contract

```javascript
import { ethers } from "ethers";
import RealEstateDAppABI from "./abis/RealEstateDApp.json";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(
    "0x...", // RealEstateDApp address
    RealEstateDAppABI,
    signer
);
```

#### 2. USDC Approval

Before any purchase, users must approve USDC spending:

```javascript
const usdcContract = new ethers.Contract(
    await contract.usdcToken(),
    ["function approve(address spender, uint256 amount) returns (bool)"],
    signer
);

// Approve unlimited spending (use with caution)
await usdcContract.approve(
    contract.address,
    ethers.constants.MaxUint256
);

// Or approve specific amount
await usdcContract.approve(
    contract.address,
    ethers.utils.parseUnits("100000", 6) // 100k USDC
);
```

#### 3. NFT Approval (Sellers Only)

Sellers must approve the contract to manage their NFTs:

```javascript
// Approve specific token
await contract.approve(contract.address, tokenId);

// Or approve all tokens
await contract.setApprovalForAll(contract.address, true);
```

### Common UI Flows

#### Seller Flow

```javascript
// 1. Register as seller
await contract.registerSeller();

// 2. Create asset
const tx = await contract.createAsset(
    "ipfs://QmXYZ.../metadata.json",
    ethers.utils.parseUnits("100000", 6) // 100k USDC
);
await tx.wait();

// 3. Wait for admin verification
// Listen for AssetVerified event

// 4. View your assets
const myAssets = await contract.getSellerAssets(sellerAddress);

// 5. Check metrics
const [confirmed, canceled] = await contract.getSellerMetrics(sellerAddress);
```

#### Buyer Flow - Full Asset

```javascript
// 1. Browse available assets
const availableAssets = await contract.fetchAvailableAssets();

// 2. Get detailed asset info
const assetInfo = await contract.getAssetDisplayInfo(tokenId);

// 3. Approve USDC spending
await usdcContract.approve(contract.address, assetInfo.price);

// 4. Purchase asset
await contract.buyAsset(tokenId);

// 5. Confirm payment to complete purchase
await contract.confirmAssetPayment(tokenId);

// OR cancel if needed
// await contract.cancelAssetPurchase(tokenId);
```

#### Buyer Flow - Fractional Investment

```javascript
// 1. Browse fractionalized assets
const fractionalAssets = await contract.fetchFractionalizedAssets();

// 2. Get asset details
const assetInfo = await contract.getAssetDisplayInfo(tokenId);
console.log("Price per token:", assetInfo.pricePerFractionalToken);
console.log("Remaining tokens:", assetInfo.remainingFractionalTokens);

// 3. Calculate purchase amount
const numTokens = 100;
const totalCost = assetInfo.pricePerFractionalToken * numTokens;

// 4. Approve USDC
await usdcContract.approve(contract.address, totalCost);

// 5. Buy fractions
await contract.buyFractionalAsset(tokenId, numTokens);

// 6. View portfolio
const portfolio = await contract.getBuyerPortfolio(buyerAddress);
portfolio.forEach(item => {
    console.log(`Asset ${item.tokenId}: ${item.fractionalTokensOwned} tokens`);
    console.log(`Ownership: ${item.ownershipPercentage / 1e18}%`);
    console.log(`Value: ${item.investmentValue / 1e6}`);
});

// 7. Cancel fractional investment (if admin allows and needed)
// Check if withdrawals are enabled
const canWithdraw = await contract.buyerCanWithdraw(tokenId);
if (canWithdraw) {
    // Must approve ERC-20 token transfer back
    const realEstateTokenContract = new ethers.Contract(
        await contract.realEstateToken(),
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer
    );
    const tokensToWithdraw = 50; // Partial withdrawal
    await realEstateTokenContract.approve(
        contract.address,
        tokensToWithdraw
    );
    await contract.cancelFractionalAssetPurchase(tokenId, tokensToWithdraw);
}
```

#### Share Holder Flow - Secondary Market Trading

```javascript
// 1. View your portfolio
const portfolio = await contract.getBuyerPortfolio(userAddress);

// 2. Option A: Direct Transfer (P2P, no fees)
const recipientAddress = "0x...";
const sharesToTransfer = 25;

// Approve ERC-20 token transfer
const realEstateTokenContract = new ethers.Contract(
    await contract.realEstateToken(),
    ["function approve(address spender, uint256 amount) returns (bool)"],
    signer
);
await realEstateTokenContract.approve(contract.address, sharesToTransfer);

// Transfer shares
await contract.transferShares(tokenId, recipientAddress, sharesToTransfer);

// 2. Option B: List on marketplace (2% fee)
const sharesToSell = 50;
const pricePerShare = ethers.utils.parseUnits("110", 6); // 110 USDC each

// Approve ERC-20 token transfer to contract (escrow)
await realEstateTokenContract.approve(contract.address, sharesToSell);

// List shares
const tx = await contract.listSharesForSale(tokenId, sharesToSell, pricePerShare);
const receipt = await tx.wait();

// Get listing ID from event
const event = receipt.events.find(e => e.event === "SharesListed");
const listingId = event.args.listingId;

// 3. View active listings for an asset
const listings = await contract.getAssetShareListings(tokenId);
listings.forEach(listing => {
    console.log(`Listing ${listing.listingId}`);
    console.log(`  Seller: ${listing.seller}`);
    console.log(`  Shares: ${listing.numShares}`);
    console.log(`  Price/Share: ${ethers.utils.formatUnits(listing.pricePerShare, 6)}`);
    console.log(`  Total: ${ethers.utils.formatUnits(listing.numShares.mul(listing.pricePerShare), 6)}`);
});

// 4. Cancel your listing
await contract.cancelShareListing(listingId);

// 5. Buy shares from marketplace
const listingToBuy = listings[0];
const totalCost = listingToBuy.numShares.mul(listingToBuy.pricePerShare);

// Approve USDC
await usdcContract.approve(contract.address, totalCost);

// Buy shares
await contract.buyListedShares(listingToBuy.listingId);
```

#### Admin Flow

```javascript
// 1. Add new admin
await contract.addAdmin(adminAddress);

// 2. Verify assets
await contract.verifyAsset(tokenId);

// 3. Create fractional asset
await contract.createFractionalAsset(tokenId, 10000); // 10k tokens

// 4. Control withdrawal permissions
// Disable withdrawals during fundraising
await contract.setBuyerCanWithdraw(tokenId, false);

// Enable withdrawals after project completion
await contract.setBuyerCanWithdraw(tokenId, true);

// 5. Distribute dividends
const dividendAmount = ethers.utils.parseUnits("5000", 6); // 5k USDC
await contract.distributeFractionalDividends(tokenId, dividendAmount);

// 6. Delist problematic asset
await contract.delistAsset(tokenId);

// 7. Withdraw fees (owner only)
await contract.withdrawUSDC(treasuryAddress, withdrawAmount);
```

### Event Listening

Monitor contract events for real-time updates:

```javascript
// Asset created
contract.on("AssetCreated", (tokenId, price, seller, verified) => {
    console.log(`New asset ${tokenId} listed by ${seller}`);
    console.log(`Price: ${ethers.utils.formatUnits(price, 6)}`);
    // Update UI: add asset to marketplace
});

// Asset purchased
contract.on("AssetPurchased", (tokenId, buyer, price) => {
    console.log(`Asset ${tokenId} purchased by ${buyer}`);
    // Update UI: mark as pending
});

// Asset verified
contract.on("AssetVerified", (tokenId, seller) => {
    console.log(`Asset ${tokenId} verified`);
    // Update UI: show as available
});

// Fractional purchase
contract.on("FractionalAssetPurchased", (tokenId, buyer, numTokens, totalPrice) => {
    console.log(`${buyer} bought ${numTokens} tokens of asset ${tokenId}`);
    // Update UI: update remaining tokens
});

// Dividends distributed
contract.on("FractionalDividendsDistributed", (tokenId, totalAmount, buyers, amounts) => {
    console.log(`Dividends distributed for asset ${tokenId}`);
    buyers.forEach((buyer, i) => {
        console.log(`${buyer} received ${ethers.utils.formatUnits(amounts[i], 6)}`);
    });
    // Update UI: show dividend notifications
});

// Asset canceled
contract.on("AssetCanceled", (tokenId, buyer) => {
    console.log(`Purchase of asset ${tokenId} canceled by ${buyer}`);
    // Update UI: restore asset to available
});

// Payment confirmed
contract.on("AssetPaymentConfirmed", (tokenId, buyer) => {
    console.log(`Asset ${tokenId} sold to ${buyer}`);
    // Update UI: mark as sold
});

// Shares transferred
contract.on("SharesTransferred", (tokenId, from, to, numShares) => {
    console.log(`${numShares} shares of asset ${tokenId} transferred from ${from} to ${to}`);
    // Update UI: refresh portfolio
});

// Shares listed
contract.on("SharesListed", (listingId, tokenId, seller, numShares, pricePerShare) => {
    console.log(`Listing ${listingId}: ${seller} listed ${numShares} shares at ${ethers.utils.formatUnits(pricePerShare, 6)} USDC each`);
    // Update UI: add to marketplace
});

// Shares purchased
contract.on("SharesPurchased", (listingId, tokenId, buyer, seller, numShares, totalPrice) => {
    console.log(`Listing ${listingId}: ${buyer} bought ${numShares} shares from ${seller} for ${ethers.utils.formatUnits(totalPrice, 6)} USDC`);
    // Update UI: remove listing, update portfolios
});

// Share listing canceled
contract.on("ShareListingCanceled", (listingId, tokenId, seller) => {
    console.log(`Listing ${listingId} canceled by ${seller}`);
    // Update UI: remove listing
});
```

### Data Fetching Patterns

#### Marketplace Display

```javascript
// Get all available assets with full info
async function loadMarketplace() {
    const assets = await contract.fetchAvailableAssets();
    
    return assets.map(asset => ({
        tokenId: asset.tokenId.toString(),
        price: ethers.utils.formatUnits(asset.price, 6),
        seller: asset.seller,
        verified: asset.verified,
        sold: asset.sold,
        imageURL: await fetchMetadata(asset.tokenURI).imageURL,
        isFractionalized: asset.isFractionalized,
        fractionalDetails: asset.isFractionalized ? {
            totalTokens: asset.totalFractionalTokens.toString(),
            remaining: asset.remainingFractionalTokens.toString(),
            pricePerToken: ethers.utils.formatUnits(asset.pricePerFractionalToken, 6),
            soldPercentage: ((asset.totalFractionalTokens - asset.remainingFractionalTokens) * 100 / asset.totalFractionalTokens).toFixed(2)
        } : null
    }));
}

// Get secondary market listings
async function loadSecondaryMarket() {
    const allListings = await contract.getAllActiveShareListings();
    
    return Promise.all(allListings.map(async (listing) => {
        const assetInfo = await contract.getAssetDisplayInfo(listing.tokenId);
        const metadata = await fetchMetadata(assetInfo.tokenURI);
        
        return {
            listingId: listing.listingId.toString(),
            tokenId: listing.tokenId.toString(),
            seller: listing.seller,
            numShares: listing.numShares.toString(),
            pricePerShare: ethers.utils.formatUnits(listing.pricePerShare, 6),
            totalPrice: ethers.utils.formatUnits(listing.numShares.mul(listing.pricePerShare), 6),
            assetName: metadata.name,
            assetImage: metadata.imageURL,
            originalPricePerToken: ethers.utils.formatUnits(assetInfo.pricePerFractionalToken, 6),
            priceChange: ((listing.pricePerShare.sub(assetInfo.pricePerFractionalToken).mul(100)) / assetInfo.pricePerFractionalToken).toString()
        };
    }));
}
```

#### Asset Detail Page

```javascript
async function loadAssetDetails(tokenId) {
    const asset = await contract.getAssetDisplayInfo(tokenId);
    
    let fractionalBuyers = [];
    let shareListings = [];
    
    if (asset.isFractionalized) {
        fractionalBuyers = await contract.fetchFractionalAssetBuyers(tokenId);
        shareListings = await contract.getAssetShareListings(tokenId);
    }
    
    return {
        ...asset,
        priceFormatted: ethers.utils.formatUnits(asset.price, 6),
        metadata: await fetchMetadata(asset.tokenURI),
        fractionalBuyers: fractionalBuyers.map(buyer => ({
            address: buyer.buyer,
            tokens: buyer.numTokens.toString(),
            percentage: (buyer.percentage / 1e18).toFixed(2)
        })),
        activeShareListings: shareListings.map(listing => ({
            listingId: listing.listingId.toString(),
            seller: listing.seller,
            numShares: listing.numShares.toString(),
            pricePerShare: ethers.utils.formatUnits(listing.pricePerShare, 6),
            totalPrice: ethers.utils.formatUnits(listing.numShares.mul(listing.pricePerShare), 6)
        }))
    };
}
```

#### User Portfolio

```javascript
async function loadUserPortfolio(userAddress) {
    const portfolio = await contract.getBuyerPortfolio(userAddress);
    
    return Promise.all(portfolio.map(async (item) => {
        const assetInfo = await contract.getAssetDisplayInfo(item.tokenId);
        const canWithdraw = await contract.buyerCanWithdraw(item.tokenId);
        const activeListings = await contract.getAssetShareListings(item.tokenId);
        
        // Check if user has any active listings
        const userListings = activeListings.filter(
            listing => listing.seller.toLowerCase() === userAddress.toLowerCase()
        );
        
        return {
            tokenId: item.tokenId.toString(),
            tokensOwned: item.fractionalTokensOwned.toString(),
            ownership: (item.ownershipPercentage / 1e18).toFixed(2) + "%",
            invested: ethers.utils.formatUnits(item.investmentValue, 6),
            currentValue: ethers.utils.formatUnits(item.investmentValue, 6), // Could add price appreciation logic
            metadata: await fetchMetadata(assetInfo.tokenURI),
            canWithdraw: canWithdraw,
            userListings: userListings.map(listing => ({
                listingId: listing.listingId.toString(),
                numShares: listing.numShares.toString(),
                pricePerShare: ethers.utils.formatUnits(listing.pricePerShare, 6)
            })),
            availableToTrade: item.fractionalTokensOwned.sub(
                userListings.reduce((sum, l) => sum.add(l.numShares), ethers.BigNumber.from(0))
            ).toString()
        };
    }));
}
```

#### Seller Dashboard

```javascript
async function loadSellerDashboard(sellerAddress) {
    const assets = await contract.getSellerAssets(sellerAddress);
    const [confirmed, canceled] = await contract.getSellerMetrics(sellerAddress);
    
    const totalListings = assets.length;
    const soldAssets = assets.filter(a => a.sold).length;
    const pendingVerification = assets.filter(a => !a.verified).length;
    const fractionalizedAssets = assets.filter(a => a.isFractionalized).length;
    
    return {
        metrics: {
            totalListings,
            soldAssets,
            pendingVerification,
            fractionalizedAssets,
            confirmedPurchases: confirmed.toString(),
            canceledPurchases: canceled.toString(),
            successRate: confirmed > 0 ? ((confirmed / (confirmed + canceled)) * 100).toFixed(2) : "0.00"
        },
        assets: assets.map(asset => ({
            ...asset,
            priceFormatted: ethers.utils.formatUnits(asset.price, 6),
            status: getAssetStatus(asset)
        }))
    };
}

function getAssetStatus(asset) {
    if (asset.sold) return "Sold";
    if (asset.isCanceled) return "Canceled";
    if (asset.isPaidFor) return "Pending Confirmation";
    if (!asset.verified) return "Pending Verification";
    if (asset.isFractionalized) return "Fractionalized";
    return "Listed";
}
```

### Metadata Handling

Assets use token URIs pointing to metadata (typically IPFS):

```javascript
async function fetchMetadata(tokenURI) {
    // Convert IPFS URI to gateway URL
    const url = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
    
    const response = await fetch(url);
    const metadata = await response.json();
    
    return {
        name: metadata.name,
        description: metadata.description,
        imageURL: metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/"),
        attributes: metadata.attributes || [],
        // Additional fields...
    };
}
```

**Expected Metadata Schema:**
```json
{
    "name": "Luxury Villa in Miami",
    "description": "5 bed, 4 bath beachfront property",
    "image": "ipfs://QmXYZ.../image.jpg",
    "attributes": [
        { "trait_type": "Location", "value": "Miami, FL" },
        { "trait_type": "Property Type", "value": "Residential" },
        { "trait_type": "Bedrooms", "value": "5" },
        { "trait_type": "Bathrooms", "value": "4" },
        { "trait_type": "Square Feet", "value": "4500" }
    ]
}
```

---

## Security Considerations

### Built-in Security Features

1. **ReentrancyGuard**
   - Applied to all functions with external calls
   - Prevents reentrancy attacks on `buyAsset`, `confirmAssetPayment`, `cancelAssetPurchase`, `buyFractionalAsset`, `cancelFractionalAssetPurchase`, `distributeFractionalDividends`, `delistAsset`, `withdrawUSDC`, `transferShares`, `listSharesForSale`, `buyListedShares`, `cancelShareListing`

2. **Access Control**
   - `onlyOwner` for critical admin management
   - `onlyAdmin` for asset verification and management
   - Seller registration required for listing

3. **Custom Errors**
   - Gas-efficient error handling
   - Clear, actionable error messages

4. **OpenZeppelin Standards**
   - Battle-tested ERC-721 implementation
   - Ownable pattern for admin control
   - ERC721Holder for safe NFT reception
   - SafeERC20 for secure token transfers

5. **Escrow Mechanism**
   - Shares held securely during marketplace listings
   - Prevents double-spending of listed shares

### Best Practices for Integrators

#### 1. Transaction Confirmation

Always wait for transaction confirmations:

```javascript
const tx = await contract.buyAsset(tokenId);
const receipt = await tx.wait(2); // Wait for 2 confirmations
console.log("Transaction confirmed:", receipt.transactionHash);
```

#### 2. Error Handling

Implement comprehensive error handling:

```javascript
async function safeBuyAsset(tokenId) {
    try {
        // Check balances first
        const assetInfo = await contract.getAssetDisplayInfo(tokenId);
        const usdcBalance = await usdcContract.balanceOf(userAddress);
        
        if (usdcBalance.lt(assetInfo.price)) {
            throw new Error("Insufficient USDC balance");
        }
        
        // Check approvals
        const allowance = await usdcContract.allowance(userAddress, contract.address);
        if (allowance.lt(assetInfo.price)) {
            const approveTx = await usdcContract.approve(contract.address, assetInfo.price);
            await approveTx.wait();
        }
        
        // Execute purchase
        const tx = await contract.buyAsset(tokenId);
        const receipt = await tx.wait();
        
        return { success: true, txHash: receipt.transactionHash };
        
    } catch (error) {
        console.error("Purchase failed:", error);
        return { success: false, error: error.message };
    }
}
```

#### 3. Gas Estimation

Estimate gas before transactions:

```javascript
try {
    const gasEstimate = await contract.estimateGas.buyAsset(tokenId);
    const gasPrice = await provider.getGasPrice();
    const estimatedCost = gasEstimate.mul(gasPrice);
    
    console.log(`Estimated gas: ${gasEstimate.toString()}`);
    console.log(`Estimated cost: ${ethers.utils.formatEther(estimatedCost)} ETH`);
    
    // Add 20% buffer
    const tx = await contract.buyAsset(tokenId, {
        gasLimit: gasEstimate.mul(120).div(100)
    });
    
} catch (error) {
    console.error("Gas estimation failed:", error);
}
```

#### 4. Frontend Validation

Validate before submitting transactions:

```javascript
function validateAssetPurchase(asset, userAddress) {
    const errors = [];
    
    if (!asset.verified) {
        errors.push("Asset not verified by admin");
    }
    
    if (asset.sold) {
        errors.push("Asset already sold");
    }
    
    if (asset.isPaidFor) {
        errors.push("Asset already has pending buyer");
    }
    
    if (asset.seller.toLowerCase() === userAddress.toLowerCase()) {
        errors.push("Cannot buy your own asset");
    }
    
    return errors;
}

function validateShareListing(tokenId, numShares, userBalance, activeListings) {
    const errors = [];
    
    if (numShares <= 0) {
        errors.push("Number of shares must be greater than zero");
    }
    
    // Calculate shares already listed
    const listedShares = activeListings
        .filter(l => l.active)
        .reduce((sum, l) => sum + parseInt(l.numShares), 0);
    
    const availableShares = userBalance - listedShares;
    
    if (numShares > availableShares) {
        errors.push(`Only ${availableShares} shares available to list`);
    }
    
    return errors;
}
```

#### 5. User Notifications

Provide clear feedback throughout the process:

```javascript
async function purchaseAssetWithFeedback(tokenId) {
    try {
        showNotification("Checking asset availability...", "info");
        
        const asset = await contract.getAssetDisplayInfo(tokenId);
        const errors = validateAssetPurchase(asset, userAddress);
        
        if (errors.length > 0) {
            showNotification(errors.join(", "), "error");
            return;
        }
        
        showNotification("Approving USDC...", "info");
        const approveTx = await usdcContract.approve(contract.address, asset.price);
        await approveTx.wait();
        
        showNotification("Initiating purchase...", "info");
        const buyTx = await contract.buyAsset(tokenId);
        
        showNotification("Waiting for confirmation...", "info");
        await buyTx.wait();
        
        showNotification("Purchase successful! You can now confirm payment.", "success");
        
    } catch (error) {
        showNotification(`Purchase failed: ${error.message}`, "error");
    }
}
```

### Known Limitations & Considerations

1. **NFT Approval Required**
   - Sellers must approve contract before listing
   - Contract checks for approval before transfers
   - Remind users to maintain approval

2. **USDC Decimals**
   - USDC uses 6 decimals (not 18)
   - Always use `parseUnits(amount, 6)` and `formatUnits(amount, 6)`

3. **Single Pending Buyer**
   - Only one buyer can have pending payment per full asset purchase
   - New buyers must wait for current buyer to confirm or cancel

4. **Fractionalization Irreversibility**
   - Once fractionalized, assets cannot be un-fractionalized
   - Admin should carefully decide on token count

5. **Withdrawal Restrictions**
   - Fractional withdrawals controlled by admin via `setBuyerCanWithdraw`
   - Prevents market manipulation during critical fundraising periods
   - Buyers can alternatively sell shares on secondary market

6. **Share Trading Considerations**
   - 2% platform fee on secondary market trades
   - Shares in active listings are held in contract escrow
   - Direct P2P transfers are fee-free but off-platform

7. **Gas Costs**
   - Array operations can be gas-intensive for assets with many fractional buyers
   - Consider pagination for large datasets

8. **Token URI Immutability**
   - Token URIs cannot be changed after minting
   - Ensure metadata is final before listing

---

## Gas Optimization

### Efficient Query Patterns

#### Use Specific Getters

```javascript
// ❌ Inefficient: Fetch all, filter in frontend
const allAssets = await contract.fetchAllListedAssets();
const available = allAssets.filter(a => !a.sold && a.verified);

// ✅ Efficient: Use specific getter
const available = await contract.fetchAvailableAssets();
```

#### Batch Queries

```javascript
// Group multiple reads into single multicall
import { Contract } from "@ethersproject/contracts";

const multicallContract = new Contract(
    multicallAddress,
    multicallABI,
    provider
);

const calls = [
    contract.interface.encodeFunctionData("fetchAvailableAssets", []),
    contract.interface.encodeFunctionData("getBuyerPortfolio", [userAddress]),
    contract.interface.encodeFunctionData("getSellerMetrics", [userAddress]),
    contract.interface.encodeFunctionData("getAllActiveShareListings", [])
];

const results = await multicallContract.aggregate(calls);
```

#### Cache Static Data

```javascript
// Cache constants and rarely-changing data
const LISTING_FEE = await contract.LISTING_FEE_PERCENTAGE();
const CANCELLATION_PENALTY = await contract.CANCELLATION_PENALTY_PERCENTAGE();
const SHARE_TRADING_FEE = await contract.SHARE_TRADING_FEE_PERCENTAGE();
const USDC_ADDRESS = await contract.usdcToken();
const TOKEN_ADDRESS = await contract.realEstateToken();

// Store in localStorage or state management
localStorage.setItem("contractConstants", JSON.stringify({
    LISTING_FEE,
    CANCELLATION_PENALTY,
    SHARE_TRADING_FEE,
    USDC_ADDRESS,
    TOKEN_ADDRESS
}));
```

### Transaction Optimization

#### Batch Approvals

```javascript
// Approve once for maximum amount instead of per-transaction
await usdcContract.approve(
    contract.address,
    ethers.constants.MaxUint256
);
```

#### Gas Limit Estimation

```javascript
// Estimate gas and add buffer
const gasEstimate = await contract.estimateGas.buyFractionalAsset(tokenId, numTokens);
const gasLimit = gasEstimate.mul(110).div(100); // 10% buffer

await contract.buyFractionalAsset(tokenId, numTokens, { gasLimit });
```

---

## Testing Checklist

### Smart Contract Testing

- [ ] Unit tests for all functions
- [ ] Integration tests for workflows
- [ ] Edge case testing (zero amounts, max values)
- [ ] Access control testing
- [ ] Reentrancy attack simulation
- [ ] Gas cost benchmarking
- [ ] Share trading escrow security
- [ ] Withdrawal permission logic

### Frontend Testing

- [ ] Wallet connection (MetaMask, WalletConnect, etc.)
- [ ] Network switching
- [ ] Transaction signing flow
- [ ] Error handling and user feedback
- [ ] Event listening and UI updates
- [ ] Mobile responsiveness
- [ ] Loading states and animations
- [ ] Secondary market interface

### User Flow Testing

**Seller Journey:**
- [ ] Registration
- [ ] Asset listing
- [ ] Verification waiting period
- [ ] Payment confirmation
- [ ] Metrics display
- [ ] Share listing creation

**Buyer Journey:**
- [ ] Asset browsing
- [ ] Purchase initiation
- [ ] Payment confirmation
- [ ] Cancellation flow
- [ ] Portfolio viewing

**Fractional Buyer Journey:**
- [ ] Fractionalized asset browsing
- [ ] Partial purchase
- [ ] Portfolio tracking
- [ ] Dividend reception
- [ ] Withdrawal (when enabled)
- [ ] Share listing and selling

**Share Trader Journey:**
- [ ] Browse secondary market
- [ ] List shares for sale
- [ ] Cancel listings
- [ ] Purchase listed shares
- [ ] Direct P2P transfer

**Admin Journey:**
- [ ] Asset verification
- [ ] Fractionalization setup
- [ ] Withdrawal permission management
- [ ] Dividend distribution
- [ ] Asset delisting
- [ ] Fee withdrawal

---

## Troubleshooting

### Common Issues

#### "SellerNotRegistered" Error
**Solution:** Call `registerSeller()` before `createAsset()`

#### "ContractNotApproved" Error
**Solution:** Approve contract to manage NFT:
```javascript
await contract.approve(contract.address, tokenId);
```

#### "USDCTransferFailed" Error
**Solutions:**
- Check USDC balance: `await usdcContract.balanceOf(userAddress)`
- Check allowance: `await usdcContract.allowance(userAddress, contractAddress)`
- Approve USDC: `await usdcContract.approve(contractAddress, amount)`

#### "InsufficientTokens" Error (Fractional Purchase)
**Solution:** Check remaining tokens before purchase:
```javascript
const asset = await contract.getAssetDisplayInfo(tokenId);
console.log("Remaining:", asset.remainingFractionalTokens);
```

#### "CannotWithdrawYet" Error
**Solution:** Check if withdrawals are enabled and contact admin:
```javascript
const canWithdraw = await contract.buyerCanWithdraw(tokenId);
if (!canWithdraw) {
    console.log("Withdrawals disabled. Use secondary market to sell shares.");
}
```

#### "ShareListingNotFound" or "ShareListingNotActive" Error
**Solution:** Verify listing exists and is still active:
```javascript
const listing = await contract.shareListings(listingId);
if (listing.listingId.toString() === "0") {
    console.log("Listing does not exist");
} else if (!listing.active) {
    console.log("Listing already filled or canceled");
}
```

#### "NotEnoughTokensOwned" Error
**Solution:** Check token balance before listing/transferring:
```javascript
const balance = await contract.getBuyerFractions(userAddress, tokenId);
console.log("Your balance:", balance.toString());

// Also check for active listings that lock tokens
const activeListings = await contract.getAssetShareListings(tokenId);
const userListings = activeListings.filter(
    l => l.seller.toLowerCase() === userAddress.toLowerCase()
);
const lockedTokens = userListings.reduce((sum, l) => sum + parseInt(l.numShares), 0);
console.log("Available to trade:", balance - lockedTokens);
```

#### Events Not Firing
**Solutions:**
- Check WebSocket connection
- Verify correct contract instance
- Use polling as fallback:
```javascript
provider.on("block", async () => {
    // Re-fetch data every block
});
```

#### Gas Estimation Failures
**Solutions:**
- Check transaction will succeed (dry run)
- Verify all prerequisites (approvals, balances)
- Use try-catch and provide manual gas limit

#### Escrow Issues
**Problem:** Shares stuck in escrow after listing
**Solution:**
```javascript
// Check if you have any active listings
const listings = await contract.getAssetShareListings(tokenId);
const myListings = listings.filter(l => 
    l.seller.toLowerCase() === userAddress.toLowerCase() && l.active
);

// Cancel listings to release shares from escrow
for (const listing of myListings) {
    await contract.cancelShareListing(listing.listingId);
}
```

---

## Function Signatures

### Seller
```
registerSeller() → 0x9e59f75d
createAsset(string,uint256) → 0x4e5a5178
```

### Admin
```
verifyAsset(uint256) → 0x8edb8ced
delistAsset(uint256) → 0x7a78c3b8
createFractionalAsset(uint256,uint256) → 0x5fa7b584
distributeFractionalDividends(uint256,uint256) → 0x8c1a4e8a
setBuyerCanWithdraw(uint256,bool) → 0x3e7d8f2c
addAdmin(address) → 0x70480275
removeAdmin(address) → 0x1785f53c
```

### Purchase
```
buyAsset(uint256) → 0x5c2b6f9d
confirmAssetPayment(uint256) → 0x8e8ed1d1
cancelAssetPurchase(uint256) → 0x68c4ac1e
buyFractionalAsset(uint256,uint256) → 0x7f4b5c9e
cancelFractionalAssetPurchase(uint256,uint256) → 0x9a7c4e2f
```

### Share Trading
```
transferShares(uint256,address,uint256) → 0x3f8b9c7a
listSharesForSale(uint256,uint256,uint256) → 0x6e5d4a2b
buyListedShares(uint256) → 0x8c7f3e1d
cancelShareListing(uint256) → 0x4b9a2f6e
```

### Getters
```
fetchAsset(uint256) → 0x7f345965
fetchAvailableAssets() → 0x5e4f3d2a
getBuyerPortfolio(address) → 0x6d8b2c1f
getAssetDisplayInfo(uint256) → 0x4a9e3f7b
getAssetShareListings(uint256) → 0x5c8e7d3a
getAllActiveShareListings() → 0x9f4b2e6c
```

---

## Deployment Guide

### Prerequisites

1. Deploy RealifiFractionalToken (ERC-20) contract first
2. Obtain USDC contract address for target network
3. Prepare deployment wallet with sufficient native token for gas

### Deployment Script

```javascript
const { ethers } = require("hardhat");

async function main() {
    // 1. Deploy RealifiFractionalToken
    const RealifiFractionalToken = await ethers.getContractFactory("RealifiFractionalToken");
    const realEstateToken = await RealifiFractionalToken.deploy();
    await realEstateToken.deployed();
    console.log("RealifiFractionalToken deployed to:", realEstateToken.address);
    
    // 2. Get USDC address (network-specific)
    const USDC_ADDRESS = "0xA0b86..."; // Replace with actual USDC address
    
    // 3. Deploy ReaLiFi
    const ReaLiFi = await ethers.getContractFactory("ReaLiFi");
    const dapp = await ReaLiFi.deploy(
        realEstateToken.address,
        USDC_ADDRESS
    );
    await dapp.deployed();
    console.log("ReaLiFi deployed to:", dapp.address);
    
    // 4. Transfer RealifiFractionalToken minting rights to DApp
    await realEstateToken.transferOwnership(dapp.address);
    console.log("RealifiFractionalToken ownership transferred");
    
    // 5. Add initial admins
    await dapp.addAdmin("0xAdmin1Address...");
    await dapp.addAdmin("0xAdmin2Address...");
    console.log("Admins added");
    
    // 6. Verify contracts on block explorer
    console.log("\nVerification commands:");
    console.log(`npx hardhat verify --network mainnet ${realEstateToken.address}`);
    console.log(`npx hardhat verify --network mainnet ${dapp.address} ${realEstateToken.address} ${USDC_ADDRESS}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
```

### Post-Deployment

1. **Verify Contracts**
   ```bash
   npx hardhat verify --network <network> <contract-address> <constructor-args>
   ```

2. **Test Basic Functions**
   - Register a test seller
   - Create a test asset
   - Verify test asset
   - Test purchase flow
   - Test fractional asset creation
   - Test share listing and trading

3. **Update Frontend Config**
   ```javascript
   export const CONTRACT_ADDRESSES = {
       reaLiFi: "0x...",
       realifiFractionalToken: "0x...",
       usdc: "0x..."
   };
   
   export const FEES = {
       listingFee: 3, // 3%
       cancellationPenalty: 1, // 1%
       shareTradingFee: 2 // 2%
   };
   ```

4. **Monitor Events**
   - Set up event monitoring service
   - Configure alerts for critical events
   - Track share trading volume

---

## Advanced Use Cases

### 1. Rental Income Distribution

Automatically distribute rental income to fractional owners:

```javascript
// Monthly rental income distribution
async function distributeMonthlyRent(tokenId, totalRent) {
    // Admin collects rent from property manager
    // Approve USDC to contract
    await usdcContract.approve(contract.address, totalRent);
    
    // Distribute to all fractional owners
    await contract.distributeFractionalDividends(tokenId, totalRent);
    
    console.log(`Distributed ${ethers.utils.formatUnits(totalRent, 6)} USDC to shareholders`);
}
```

### 2. Price Discovery Through Secondary Market

Track market sentiment via share trading:

```javascript
async function analyzeMarketSentiment(tokenId) {
    const asset = await contract.getAssetDisplayInfo(tokenId);
    const listings = await contract.getAssetShareListings(tokenId);
    
    if (listings.length === 0) {
        return { sentiment: "neutral", message: "No active listings" };
    }
    
    const avgListingPrice = listings.reduce((sum, l) => 
        sum.add(l.pricePerShare), ethers.BigNumber.from(0)
    ).div(listings.length);
    
    const originalPrice = asset.pricePerFractionalToken;
    const priceChange = avgListingPrice.sub(originalPrice).mul(100).div(originalPrice);
    
    if (priceChange.gt(10)) {
        return { sentiment: "bullish", priceChange: priceChange.toString() + "%" };
    } else if (priceChange.lt(-10)) {
        return { sentiment: "bearish", priceChange: priceChange.toString() + "%" };
    } else {
        return { sentiment: "neutral", priceChange: priceChange.toString() + "%" };
    }
}
```

### 3. Liquidity Windows

Implement scheduled liquidity windows:

```javascript
// Admin enables withdrawals during specific periods
async function manageLiquidityWindow(tokenId, startDate, endDate) {
    const now = Date.now();
    
    if (now >= startDate && now <= endDate) {
        // Enable withdrawals during window
        await contract.setBuyerCanWithdraw(tokenId, true);
        console.log("Liquidity window opened");
    } else {
        // Disable withdrawals outside window
        await contract.setBuyerCanWithdraw(tokenId, false);
        console.log("Liquidity window closed");
    }
}
```

### 4. Shareholder Voting (Off-Chain)

Weighted voting based on ownership:

```javascript
async function getVotingPower(tokenId, voterAddress) {
    const buyers = await contract.fetchFractionalAssetBuyers(tokenId);
    const voter = buyers.find(b => b.buyer.toLowerCase() === voterAddress.toLowerCase());
    
    if (!voter) {
        return { hasVotingRights: false, votingPower: 0 };
    }
    
    return {
        hasVotingRights: true,
        votingPower: parseFloat(voter.percentage) / 1e18, // Percentage as decimal
        tokens: voter.numTokens.toString()
    };
}
```

### 5. Portfolio Rebalancing

Help users rebalance their portfolios:

```javascript
async function rebalancePortfolio(userAddress, targetAllocations) {
    const portfolio = await contract.getBuyerPortfolio(userAddress);
    
    for (const target of targetAllocations) {
        const current = portfolio.find(p => p.tokenId.toString() === target.tokenId);
        const currentAllocation = current ? 
            parseFloat(ethers.utils.formatUnits(current.investmentValue, 6)) : 0;
        
        if (currentAllocation < target.targetAmount) {
            // Buy more shares
            const toBuy = target.targetAmount - currentAllocation;
            console.log(`Buy ${toBuy} USDC worth of asset ${target.tokenId}`);
        } else if (currentAllocation > target.targetAmount) {
            // Sell excess shares
            const toSell = currentAllocation - target.targetAmount;
            console.log(`Sell ${toSell} USDC worth of asset ${target.tokenId}`);
        }
    }
}
```

---

## Support & Resources

**Contact:** anitherock44@gmail.com

**Important Notes:**
- Always test on testnet before mainnet deployment
- Keep private keys secure
- Monitor contract for unusual activity
- Implement rate limiting on frontend
- Consider implementing circuit breakers for emergency situations
- Regular security audits recommended
  
---

## Changelog

### Version 2.0
- ✅ Added secondary market share trading functionality
- ✅ Implemented `transferShares` for P2P transfers
- ✅ Added `listSharesForSale`, `buyListedShares`, `cancelShareListing`
- ✅ Implemented escrow mechanism for share listings
- ✅ Added 2% trading fee for marketplace transactions
- ✅ Implemented controlled withdrawal system with `setBuyerCanWithdraw`
- ✅ Modified `cancelFractionalAssetPurchase` to support partial withdrawals
- ✅ Added new getter functions for share listings
- ✅ Enhanced portfolio tracking with listing information

### Version 1.0
- Initial release with basic functionality
- NFT-based asset representation
- Fractional ownership system
- Full asset purchase workflow
- Dividend distribution
- Admin verification system
