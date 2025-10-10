import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers, hardhatVerify],
  solidity: {
    version: "0.8.28", // Use your desired Solidity version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // You can adjust this value as needed
      },
    },
  },
  verify: {
      etherscan: {
        apiKey: process.env.SONIC_API_KEY,
      },
    },
  networks: {
    sonic: {
      //@ts-ignore
      url: process.env.SONIC_BLAZE,
      //@ts-ignore
      accounts: [process.env.OWNER_KEY]
    },
    sonicblaze: {
      url: `https://rpc.blaze.soniclabs.com`,
      //@ts-ignore
      accounts: [process.env.OWNER_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sonicblaze: process.env.SONIC_API_KEY
    },
    customChains: [
      {
        network: "sonicblaze",
        chainId: 57054,
        urls: {
          apiURL: "https://api-testnet.sonicscan.org/api", // Sonic's API URL
          browserURL: "https://testnet.sonicscan.org"   // Sonic's block explorer URL
        }
      }
    ]
  }
  };

export default config;
