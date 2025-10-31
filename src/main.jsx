import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from './wagmi.config.js';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
                accentColor: '#CAAB5B',
                accentColorForeground: '#121317',
                borderRadius: 'large',
})}>      
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);