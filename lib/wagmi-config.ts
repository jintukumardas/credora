'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, sepolia } from 'wagmi/chains';

// Custom Doma testnet chain configuration
export const domaChain = {
  id: 97476,
  name: 'Doma Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.doma.xyz'] },
    public: { http: ['https://rpc-testnet.doma.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Doma Explorer', url: 'https://explorer-testnet.doma.xyz' },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'Credora',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, base, sepolia, domaChain],
  ssr: true,
});
