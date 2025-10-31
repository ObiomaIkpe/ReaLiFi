#  REALiFI Backend — NestJS + IPFS Integration

The **REALiFI Backend** powers the file and metadata management layer of the [REALiFI](https://github.com/your-username/realifi-frontend) platform — a blockchain-based real estate investment application.

It is built with **NestJS** and serves as a lightweight bridge between the **frontend** and **IPFS (via Pinata)**, handling secure file uploads and returning accessible metadata URLs that can be stored on-chain.

---

## Overview

The REALiFI backend performs a single, critical function:

1. Accepts real estate property form data (metadata + media files) from the frontend.  
2. Uploads the data to **IPFS** using the **Pinata API**.  
3. Returns the **IPFS JSON URI** (a publicly accessible URL) to the frontend.  
4. The frontend then uses this URI to **create an on-chain asset** through smart contract interactions.

---

##  Tech Stack

| Layer | Technology |
|--------|-------------|
| Framework | [NestJS](https://nestjs.com) |
| File Upload Handling | Multer |
| IPFS Integration | [Pinata SDK](https://www.pinata.cloud/) |
| Environment Management | dotenv |
| Validation | class-validator / class-transformer |
| Language | TypeScript |

---


---

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** ≥ 18  
- A **Pinata** account with API credentials  
- (Optional) The [REALiFI Frontend](https://github.com/your-username/realifi-frontend) running locally or deployed

---

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/realifi.git
cd realifi

# Switch to the backend branch
git checkout backend

# Install dependencies
npm install

# Start the development server
npm run start:dev
```

#  Blockchain Configuration
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CHAIN_ID=11155111

REAL_ESTATE_CONTRACT_ADDRESS=
FRACTIONAL_CONTRACT_ADDRESS=
USDC_CONTRACT_ADDRESS=

#  Database Configuration
DATABASE_URL=postgresql://realifi_user:********@dpg-********.oregon-postgres.render.com/realifi
DB_HOST=dpg-********.oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

#  IPFS / Pinata Configuration
PINATA_API_KEY=
PINATA_API_SECRET=
PINATA_JWT=
PINATA_GATEWAY_URL=https://yellow-causal-crawdad-435.mypinata.cloud

#  JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
