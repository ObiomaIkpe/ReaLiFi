import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

// Define Hedera Testnet chain
const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: { 
      http: ['https://testnet.hashio.io/api'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'HashScan', 
      url: 'https://hashscan.io/testnet' 
    },
  },
  testnet: true,
};

export const wagmiConfig = getDefaultConfig({
  appName: 'RealEstate DApp',
  projectId: '2982dc2d43e92f4a059f2c0e2f74462a', 
  chains: [hederaTestnet],
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
  },
  ssr: false, // Set to true if using Next.js with SSR
});

export { hederaTestnet as chains };