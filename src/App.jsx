import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import DIDCard from "./components/DIDCard";
import Landing from "./components/Landing";
import contractABI from "./DIDRegistry.json"; // Import compiled ABI

const contractAddress = "0xYourContractAddress"; // Replace with your deployed contract address

function App() {
  const [account, setAccount] = useState(null);
  const [did, setDid] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState("");

  const checkDID = useCallback(async () => {
    if (!account) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const identity = await contract.identities(account);
      if (identity.did) {
        setDid(identity.did);
        setPublicKey(identity.publicKey);
        setIsRegistered(true);
      }
    } catch (error) {
      console.error("Error fetching DID:", error);
      setError("Failed to fetch DID information");
    }
  }, [account]);

  useEffect(() => {
    checkDID();
  }, [checkDID]);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        setError("");
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet. Please try again.");
      }
    } else {
      setError("Please install MetaMask!");
    }
  }

  async function registerDID() {
    if (!account) {
      setError("Connect your wallet first!");
      return;
    }

    if (!did || !publicKey) {
      setError("Please enter both DID and Public Key");
      return;
    }

    try {
      setError("");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.registerDID(did, publicKey);
      await tx.wait();
      setIsRegistered(true);
      setError("");
    } catch (error) {
      console.error("Registration failed:", error);
      setError("Failed to register DID. Please try again.");
    }
  }

  async function loginWithDID() {
    if (!isRegistered) {
      setError("Register DID first!");
      return;
    }
    
    try {
      setError("");
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: account, service: "Social Media" }),
      });
      const data = await response.json();
      if (data.success) {
        setError("");
      } else {
        setError("Login Failed!");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <Landing />
          <DIDCard 
            account={account}
            error={error}
            connectWallet={connectWallet}
            did={did}
            setDid={setDid}
            publicKey={publicKey}
            setPublicKey={setPublicKey}
            isRegistered={isRegistered}
            registerDID={registerDID}
            loginWithDID={loginWithDID}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
