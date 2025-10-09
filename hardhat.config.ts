import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28", // Use your desired Solidity version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // You can adjust this value as needed
      },
    },
  }
};

export default config;
