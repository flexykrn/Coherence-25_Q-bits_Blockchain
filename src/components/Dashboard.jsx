import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import AadharDID from '../contracts/AadharDID.json';
import { QRCodeSVG } from 'qrcode.react';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { account, signer } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userDID, setUserDID] = useState('');
  const [userPublicKey, setUserPublicKey] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showCredentialSelector, setShowCredentialSelector] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  const [availableCredentials, setAvailableCredentials] = useState([]);

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }

    // Generate DID from wallet address
    const did = `did:ethr:${account.toLowerCase()}`;
    setUserDID(did);

    // Generate public key from wallet address
    const addressHash = ethers.keccak256(ethers.toUtf8Bytes(account));
    const publicKey = `0x${addressHash.slice(2, 66)}`;
    setUserPublicKey(publicKey);

    // Load DIDs and recent activity
    loadUserDIDs();
  }, [account, navigate]);

  const getContract = () => {
    const contractAddress = process.env.REACT_APP_AADHAR_DID_ADDRESS;
    if (!contractAddress) {
      throw new Error('Contract address not found in environment variables');
    }
    if (!signer) {
      throw new Error('Signer not available');
    }
    return new ethers.Contract(contractAddress, AadharDID.abi, signer);
  };

  const loadUserDIDs = async () => {
    try {
      setLoading(true);
      const contract = getContract();

      // Get user's DIDs
      const userDIDs = await contract.getUserDIDs(account);
      
      // For each DID, get the details
      const detailsPromises = userDIDs.map(async (did, index) => {
        const details = await contract.getAadharDetails(account, index);
        return {
          identifier: details.identifier,
          name: details.name,
          dateOfBirth: details.dateOfBirth,
          gender: details.gender,
          address: details.addr,
          aadharNumber: details.aadharNumber,
          active: details.active,
          createdAt: Number(details.createdAt),
          updatedAt: Number(details.updatedAt)
        };
      });

      const documentsWithDetails = await Promise.all(detailsPromises);
      setDocuments(documentsWithDetails);

      // Set recent activity based on the documents
      const activity = documentsWithDetails.map(doc => ({
        type: 'DID Registration',
        description: `Identity created for ${doc.name}`,
        timestamp: doc.createdAt
      }));

      setRecentActivity(activity);
    } catch (err) {
      console.error('Error loading DIDs:', err);
      setError(err.message || 'Failed to load DIDs');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQRCode = (document) => {
    setSelectedDocument(document);
    // Set available credentials
    setAvailableCredentials([
      { key: 'name', label: 'Full Name', value: document.name },
      { key: 'aadharNumber', label: 'Aadhar Number', value: document.aadharNumber },
      { key: 'dateOfBirth', label: 'Date of Birth', value: document.dateOfBirth },
      { key: 'gender', label: 'Gender', value: document.gender },
      { key: 'address', label: 'Address', value: document.address },
      { key: 'createdAt', label: 'Created At', value: new Date(document.createdAt * 1000).toLocaleString() }
    ]);
    // Initially select all credentials
    setSelectedCredentials(availableCredentials.map(cred => cred.key));
    setShowCredentialSelector(true);
  };

  const toggleCredential = (key) => {
    setSelectedCredentials(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const generateQRData = () => {
    if (!selectedDocument) return '';
    
    const selectedData = {};
    availableCredentials.forEach(cred => {
      if (selectedCredentials.includes(cred.key)) {
        selectedData[cred.key] = cred.value;
      }
    });
    
    return JSON.stringify({
      identifier: selectedDocument.identifier,
      ...selectedData
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    return timeAgo.replace('about ', '');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Block - Identity and Recent Activity */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 backdrop-blur-lg border border-gray-700/50 shadow-xl">
              <h2 className="text-3xl font-bold mb-8 gradient-text">Your Identity</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
                  <div className="font-mono text-white break-all p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    {account}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Public Key</label>
                  <div className="font-mono text-white break-all p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <span className="opacity-100">{userPublicKey.slice(0, 20)}</span>
                    <span className="opacity-50">...</span>
                    <span className="opacity-100">{userPublicKey.slice(-8)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 backdrop-blur-lg border border-gray-700/50 shadow-xl">
              <h2 className="text-3xl font-bold mb-8 gradient-text">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="group p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-medium text-lg text-white">{activity.type}</h3>
                        <p className="text-sm text-gray-400">{activity.description}</p>
                      </div>
                      <span className="text-sm text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Block - Documents */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 backdrop-blur-lg border border-gray-700/50 shadow-xl">
              <h2 className="text-3xl font-bold mb-8 gradient-text">Your Documents</h2>
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={index} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{doc.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">Aadhar: {doc.aadharNumber}</p>
                        <p className="text-xs text-gray-500 mt-2">Created: {formatTimestamp(doc.createdAt)}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-xs ${
                          doc.active ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {doc.active ? 'Active' : 'Inactive'}
                        </div>
                        <button
                          onClick={() => handleShowQRCode(doc)}
                          className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                        >
                          View QR
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No documents found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showCredentialSelector && selectedDocument && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-gray-700/50 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold gradient-text">Select Credentials for QR Code</h2>
                <button
                  onClick={() => setShowCredentialSelector(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Document Info */}
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <h3 className="font-medium text-lg text-white">{selectedDocument.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">Aadhar: {selectedDocument.aadharNumber}</p>
                </div>

                {/* Credential Selection */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Available Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCredentials.map((cred) => (
                      <div
                        key={cred.key}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedCredentials.includes(cred.key)
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-gray-800/50 border-gray-700/50 hover:border-purple-500/30'
                        }`}
                        onClick={() => toggleCredential(cred.key)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{cred.label}</h4>
                            <p className="text-sm text-gray-400 mt-1">{cred.value}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedCredentials.includes(cred.key)
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-600'
                          }`}>
                            {selectedCredentials.includes(cred.key) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QR Code Preview */}
                <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">QR Code Preview</h3>
                  <div className="flex justify-center">
                    <QRCodeSVG 
                      value={generateQRData()} 
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowCredentialSelector(false)}
                    className="px-6 py-2 rounded-lg bg-gray-700/50 text-white hover:bg-gray-700/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCredentialSelector(false);
                      setShowQRCode(true);
                    }}
                    className="px-6 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                  >
                    Use Selected Credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final QR Code Modal */}
        {showQRCode && selectedDocument && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700/50 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold gradient-text">Document QR Code</h2>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <h3 className="font-medium text-lg text-white">{selectedDocument.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">Aadhar: {selectedDocument.aadharNumber}</p>
                </div>
                <div className="flex justify-center p-6 bg-white rounded-2xl shadow-lg">
                  <QRCodeSVG 
                    value={generateQRData()} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-500 text-center">{error}</div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 