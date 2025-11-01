# 🏠 REALiFI — Decentralized Real Estate Investment Platform (Frontend)

**REALiFI** is a blockchain-based real estate platform that enables users to **invest in tokenized real estate assets**, own **fractions of properties**, and interact seamlessly with smart contracts through an intuitive web interface.

This repository contains the **frontend** of the REALiFI platform — built with modern web technologies and integrated with **Hedera Testnet**, **Wagmi**, and **Viem** for secure blockchain interactions.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Framework | React + Vite |
| Blockchain Integration | Wagmi + Viem + RainbowKit |
| Smart Contracts | Hedera Testnet (ERC-like tokens) |
| Styling | Tailwind CSS v3 |
| Forms & Validation | React Hook Form + Zod |
| Routing | React Router DOM |
| Animations | Framer Motion |
| Data Fetching | React Query |
| File Upload | NestJS backend (uploads to IPFS) |

---

## How It Works

1. **Wallet Connection**  
   Users connect a Hedera-compatible wallet through **RainbowKit** and **Wagmi**.

2. **Asset Creation**  
   - Users upload property details (metadata + image).  
   - The **NestJS backend** handles file uploads to **IPFS** and returns the **JSON URI**.  
   - The frontend uses that URI to create the asset on-chain by writing to the **Hedera smart contract**.

3. **Investments & Ownership**  
   - Users can view listed assets and invest using **fractionalized tokens**.  
   - Purchases are simulated using **Hedera Testnet tokens (USDC)**.  
   - Smart contract reads/writes are managed through **Viem** and **Wagmi hooks**.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** ≥ 18  
- **npm** or **yarn**  
- Access to a **Hedera Testnet wallet** (e.g., HashPack)  
- The **REALiFI backend** (NestJS + IPFS) available at:  
   `https://realifi.onrender.com`

---

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/realifi-frontend.git
cd realifi-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```


💡 Future Improvements

Multi-chain support (Ethereum, Base, Polygon)

Advanced analytics dashboard for investors

In-app property valuation estimator

PWA (Progressive Web App) version for mobile

| Component       | Network                              | Description                    |
| --------------- | ------------------------------------ | ------------------------------ |
| Network         | Hedera Testnet                       | Used for development & testing |
| Token Standards | ERC-721 (Assets), ERC-20 (Fractions) | Tokenization model             |
| Storage         | IPFS                                 | Property metadata and media    |
| Payments        | USDC (Testnet)                       | Investment transactions        |
| Libraries       | Wagmi + Viem                         | Read/write operations          |


## 🌐 Related Repositories

- **Backend (NestJS + IPFS)** → [REALiFI Backend (backend branch)](https://github.com/ObiomaIkpe/realifi/tree/backend)
- **Smart Contracts** → [REALiFI Contracts (contracts branch)](https://github.com/ObiomaIkpe/realifi/tree/contracts)

