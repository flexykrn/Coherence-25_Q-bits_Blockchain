import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);

          // Create provider and signer
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          const signer = await provider.getSigner();
          setSigner(signer);

          // Check if we're on Holesky network
          const network = await provider.getNetwork();
          if (network.chainId !== 17000) {
            try {
              // Request network switch to Holesky
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x4268' }], // 17000 in hex
              });
            } catch (switchError) {
              // If Holesky network is not added, add it
              if (switchError.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x4268',
                    chainName: 'Holesky Testnet',
                    nativeCurrency: {
                      name: 'Holesky ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['https://ethereum-holesky.publicnode.com'],
                    blockExplorerUrls: ['https://holesky.etherscan.io']
                  }]
                });
              }
              throw switchError;
            }
          }
        } catch (error) {
          console.error('Error initializing provider:', error);
        }
      }
    };

    initProvider();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        const signer = await provider.getSigner();
        setSigner(signer);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  return (
    <WalletContext.Provider value={{ account, signer, provider, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}; 