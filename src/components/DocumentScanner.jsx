import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import AadharDID from '../contracts/AadharDID.json';

const DocumentScanner = () => {
  const { account, signer } = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const scanDocument = async () => {
    if (!selectedFile) {
      setError('Please select a document first');
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      // Here you would integrate with your document scanning API
      // For now, we'll simulate the scanning process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulated scanned data
      const mockScannedData = {
        name: "John Doe",
        dateOfBirth: "1990-01-01",
        gender: "M",
        addr: "123 Main St, City",
        photoHash: "0x123...abc",
        aadharNumber: "1234-5678-9012"
      };

      setScannedData(mockScannedData);
    } catch (error) {
      console.error('Scanning error:', error);
      setError('Failed to scan document. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const createDIDFromDocument = async () => {
    if (!scannedData) {
      setError('Please scan a document first');
      return;
    }

    try {
      const contract = new ethers.Contract(
        process.env.REACT_APP_AADHAR_DID_ADDRESS,
        AadharDID.abi,
        signer
      );

      const did = `did:ethr:${account?.toLowerCase()}:${Date.now()}`;
      
      const tx = await contract.createAadharDID(
        did,
        scannedData.name,
        scannedData.dateOfBirth,
        scannedData.gender,
        scannedData.addr,
        scannedData.photoHash,
        scannedData.aadharNumber
      );

      await tx.wait();
      setIsSuccess(true);
    } catch (error) {
      console.error('DID creation error:', error);
      setError('Failed to create DID from document. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900/50 rounded-xl p-8 backdrop-blur-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-4">
              Scan Your Document
            </h1>
            <p className="text-gray-400">
              Upload your document to scan and create a DID. We'll extract the information and create a verifiable credential on the blockchain.
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="document-upload"
              />
              <label
                htmlFor="document-upload"
                className="cursor-pointer block"
              >
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-400">
                    {selectedFile ? selectedFile.name : 'Click to upload document'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={scanDocument}
              disabled={isScanning || !selectedFile}
              className={`flex-1 px-6 py-3 rounded-lg button-gradient text-white transition-all ${
                (isScanning || !selectedFile) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isScanning ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </div>
              ) : 'Scan Document'}
            </button>
          </div>

          {/* Scanned Data Display */}
          {scannedData && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-medium text-white mb-4">Scanned Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <div className="text-white">{scannedData.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date of Birth</label>
                  <div className="text-white">{scannedData.dateOfBirth}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
                  <div className="text-white">{scannedData.gender}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                  <div className="text-white">{scannedData.addr}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Photo Hash</label>
                  <div className="text-white font-mono text-sm">{scannedData.photoHash}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Aadhar Number</label>
                  <div className="text-white">{scannedData.aadharNumber}</div>
                </div>
              </div>
            </div>
          )}

          {/* Create DID Button */}
          {scannedData && (
            <button
              onClick={createDIDFromDocument}
              className="w-full px-6 py-3 rounded-lg button-gradient text-white hover:opacity-90 transition-opacity"
            >
              Create DID from Document
            </button>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-gray-900 p-6 rounded-xl shadow-xl">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white text-center mb-2">DID Created Successfully!</h3>
                <p className="text-gray-400 text-center">Your document has been scanned and a DID has been created on the blockchain.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentScanner; 