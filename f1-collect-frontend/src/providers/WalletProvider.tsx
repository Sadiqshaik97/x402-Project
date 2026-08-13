"use client";

import React, { ReactNode } from "react";
import { WalletId, WalletManager, WalletProvider as AlgorandWalletProvider } from "@txnlab/use-wallet-react";

export function WalletProvider({ children }: { children: ReactNode }) {
  // We initialize the wallet manager once per client instance
  const [walletManager] = React.useState(() => new WalletManager({
    wallets: [
      { id: WalletId.PERA }
    ],
    defaultNetwork: 'testnet',
    networks: {
      testnet: {
        algod: {
          baseServer: 'https://testnet-api.algonode.cloud',
          port: '443',
          token: '',
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  }));

  return (
    <AlgorandWalletProvider manager={walletManager}>
      {children}
    </AlgorandWalletProvider>
  );
}
