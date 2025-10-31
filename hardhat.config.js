require("@nomicfoundation/hardhat-toolbox");
  require('dotenv').config();

  module.exports = {
    solidity: {
      version: "0.8.28",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        viaIR: true,
      },
    },
    networks: {
      testnet: {
      type: "http",
      url: process.env.RPC_URL,
      accounts: [process.env.OPERATOR_KEY]
    }
    },
etherscan: {
  apiKey: {
    testnet: "abc", // dummy key
  },
  customChains: [
    {
      network: "testnet",
      chainId: 296,
      urls: {
        apiURL: "https://server-verify.hashscan.io", // Hedera Sourcify verify endpoint
        browserURL: "https://hashscan.io/testnet",
      },
    },
  ],
},
sourcify: {
  enabled: true,
  apiUrl: "https://server-verify.hashscan.io",
},

};
