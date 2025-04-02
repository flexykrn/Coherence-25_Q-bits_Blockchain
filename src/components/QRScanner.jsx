import React, { useState } from 'react';
import { ethers } from 'ethers';
import AadharDID from '../contracts/AadharDID.json';

const DocumentScanner = () => {
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPdfFile(file);
      
      // Create a URL for the PDF preview
      const fileUrl = URL.createObjectURL(file);
      setPdfPreview(fileUrl);

      // Here you would typically:
      // 1. Extract text from PDF
      // 2. Parse the extracted text to find DID information
      // 3. Verify the DID on the blockchain
      
      // For now, we'll simulate this with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data - replace with actual PDF processing
      const mockData = {
        identifier: "did:ethr:0x1234...5678",
        name: "John Doe",
        aadharNumber: "1234-5678-9012",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        address: "123 Main St, City",
        verified: true
      };

      setScannedData(mockData);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError('Failed to process PDF file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text text-center">Upload Identity Document</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-[calc(100vh-12rem)]">
          {/* PDF Upload */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-6 backdrop-blur-lg border border-gray-700/50 shadow-xl flex flex-col">
            <h2 className="text-2xl font-bold mb-4 gradient-text">Upload PDF Document</h2>
            <div className="flex-1 min-h-[400px] bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center p-6">
              {pdfPreview ? (
                <div className="w-full h-full flex flex-col items-center">
                  <iframe
                    src={pdfPreview}
                    className="w-full h-full rounded-lg"
                    title="PDF Preview"
                  />
                  <button
                    onClick={() => {
                      setPdfFile(null);
                      setPdfPreview(null);
                      setScannedData(null);
                    }}
                    className="mt-4 px-6 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Remove PDF
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <label className="cursor-pointer">
                    <span className="block text-gray-400 mb-2">Drag and drop your PDF here, or</span>
                    <span className="px-6 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-400">PDF files only</p>
                </div>
              )}
            </div>
          </div>

          {/* Document Information Display */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-6 backdrop-blur-lg border border-gray-700/50 shadow-xl overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 gradient-text sticky top-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 py-2">Document Information</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-white">Processing document...</div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : scannedData ? (
              <div className="space-y-4">
                {/* Verification Status */}
                <div className={`p-4 rounded-xl ${
                  scannedData.verified 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : 'bg-red-500/20 border-red-500/50'
                } border`}>
                  <div className="flex items-center space-x-2">
                    {scannedData.verified ? (
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`font-medium ${
                      scannedData.verified ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {scannedData.verified ? 'Verified Document' : 'Unverified Document'}
                    </span>
                  </div>
                </div>

                {/* Identity Information */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Identity Details</h3>
                    <div className="space-y-3">
                      {Object.entries(scannedData).map(([key, value]) => {
                        if (key === 'verified') return null;
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-white font-medium">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DID Information */}
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Decentralized Identifier</h3>
                    <div className="font-mono text-sm text-gray-400 break-all">
                      {scannedData.identifier}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 sticky bottom-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 py-4">
                  <button
                    onClick={() => {
                      setPdfFile(null);
                      setPdfPreview(null);
                      setScannedData(null);
                    }}
                    className="flex-1 px-6 py-2 rounded-lg bg-gray-700/50 text-white hover:bg-gray-700/70 transition-colors"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 px-6 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                  >
                    Print Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                Upload a PDF document to view identity information
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentScanner; 