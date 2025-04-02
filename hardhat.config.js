require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const HOLESKY_RPC_URL = process.env.HOLESKY_RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    holesky: {
      url: HOLESKY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 17000
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "holesky",
        chainId: 17000,
        urls: {
          apiURL: "https://api-holesky.etherscan.io/api",
          browserURL: "https://holesky.etherscan.io"
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts"
  }
}; 