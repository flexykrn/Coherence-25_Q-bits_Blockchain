const axios = require('axios');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;

// Function to upload file to IPFS via Pinata
async function uploadToIPFS(data) {
    try {
        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
        const response = await axios.post(
            url,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}

// Function to retrieve file from IPFS via Pinata gateway
async function retrieveFromIPFS(hash) {
    try {
        const url = `https://${PINATA_GATEWAY_URL}/ipfs/${hash}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error retrieving from IPFS:', error);
        throw error;
    }
}

// Function to unpin file from Pinata
async function unpinFromIPFS(hash) {
    try {
        const url = `https://api.pinata.cloud/pinning/unpin/${hash}`;
        await axios.delete(
            url,
            {
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );
        return true;
    } catch (error) {
        console.error('Error unpinning from IPFS:', error);
        throw error;
    }
}

module.exports = {
    uploadToIPFS,
    retrieveFromIPFS,
    unpinFromIPFS
}; 