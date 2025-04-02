import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import AadharDID from '../contracts/AadharDID.json';
import { createWorker } from 'tesseract.js';

const DIDRegistration = () => {
  const { account, signer } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    aadharNumber: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  // Function to clean extracted text
  const cleanText = (text) => {
    return text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  };

  // Function to extract specific information based on pattern
  const extractSpecificText = (text, pattern) => {
    const regex = new RegExp(pattern, 'g');
    const matches = text.match(regex);
    return matches ? matches[0] : '';
  };

  const preprocessImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Apply grayscale and contrast
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const contrast = 1.5; // Adjust contrast factor as needed
            
            const newValue = ((avg - 128) * contrast) + 128;
            data[i] = data[i + 1] = data[i + 2] = newValue;
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Start scanning
    setScanning(true);
    setScanProgress(0);
    setError('');

    try {
      // Preprocess the image
      setScanProgress(20);
      const processedImageData = await preprocessImage(file);

      // Initialize Tesseract worker
      setScanProgress(40);
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Set up progress monitoring
      worker.setProgressHandler(progress => {
        setScanProgress(40 + Math.floor(progress.progress * 40));
      });

      // Perform OCR
      setScanProgress(60);
      const { data: { text } } = await worker.recognize(processedImageData);
      await worker.terminate();

      // Clean and extract data
      setScanProgress(80);
      const cleanedText = cleanText(text);
      
      // Extract specific information
      const extractedData = {
        name: extractSpecificText(cleanedText, /([A-Za-z]+(?:\s[A-Za-z]+)+)/g),
        aadharNumber: extractSpecificText(cleanedText, /\d{4}\s?\d{4}\s?\d{4}/g),
        dob: extractSpecificText(cleanedText, /\d{2}\/\d{2}\/\d{4}/g),
        gender: extractSpecificText(cleanedText, /Gender\s*:\s*([MF])/i),
        address: extractSpecificText(cleanedText, /Address\s*:\s*([^\n]+)/i)
      };

      setFormData(extractedData);
      setScanProgress(100);
      setScanning(false);
    } catch (err) {
      console.error('Error scanning image:', err);
      setError('Failed to scan Aadhar card. Please try again.');
      setScanning(false);
      setScanProgress(0);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const contractAddress = process.env.REACT_APP_AADHAR_DID_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not found');
      }

      const contract = new ethers.Contract(
        contractAddress,
        AadharDID.abi,
        signer
      );

      // Create a unique identifier
      const identifier = `did:aadhar:${account.toLowerCase()}:${Date.now()}`;

      // Call the contract's createAadharDID function
      const tx = await contract.createAadharDID(
        identifier,
        formData.name,
        formData.dateOfBirth,
        formData.gender,
        formData.address,
        '', // photoHash (empty for now)
        formData.aadharNumber
      );

      setSuccess('Processing your registration...');
      await tx.wait();
      
      setSuccess('DID Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register DID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white pt-24">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 backdrop-blur-lg border border-gray-700/50 shadow-xl">
          <h2 className="text-3xl font-bold mb-8 gradient-text">Register Your DID</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white"
                required
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white"
                required
              >
                <option value="">Select gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white"
                required
                rows="3"
                placeholder="Enter your full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white"
                required
                placeholder="XXXX-XXXX-XXXX"
                pattern="[0-9]{4}[-]?[0-9]{4}[-]?[0-9]{4}"
                title="Please enter a valid 12-digit Aadhar number"
              />
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl button-gradient text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register DID'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DIDRegistration; 