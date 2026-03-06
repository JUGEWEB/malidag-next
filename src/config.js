"use client"

import { http, createConfig } from 'wagmi'
import { base, mainnet,bscTestnet, bsc, polygon, avalanche, linea, optimism, arbitrum, zksync } from 'wagmi/chains'
import { safe, walletConnect, coinbaseWallet, metaMask } from 'wagmi/connectors'

const projectId = 'f187ec6a36c349c4d2068c1344a41619'

export const config = createConfig({
  chains: [mainnet, base, bsc, bscTestnet, polygon, avalanche, linea, optimism, arbitrum, zksync],
  connectors: [
    walletConnect({ projectId }),
    safe(),
    coinbaseWallet(),
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [polygon.id]: http(),
    [avalanche.id]: http(),
    [linea.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [zksync.id]: http()
    
  },
})