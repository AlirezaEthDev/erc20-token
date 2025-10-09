require('@nomicfoundation/hardhat-verify');
require("@nomicfoundation/hardhat-toolbox");
const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

const SONIC_API_KEY = process.env.SONIC_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

task('deploy', 'Deploys contract on specific chain', async () => {

  const provider = new ethers.JsonRpcProvider('https://rpc.blaze.soniclabs.com');
  const owner = new ethers.Wallet(process.env.OWNER_KEY, provider);

  const tokenObj = JSON.parse(fs.readFileSync('artifacts/contracts/erc20.sol/ERC20.json'));

  const tokenFactory = new ethers.ContractFactory(tokenObj.abi, tokenObj.bytecode, owner);

  const token = await tokenFactory.deploy(
    'Kia Coin',
    'KIA',
    18,
    ethers.parseUnits('1000000000',18)
  );
  await token.deploymentTransaction().wait(1);

  console.info(`LP token: ${token.target}`);

})

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28", // Use your desired Solidity version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // You can adjust this value as needed
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  sourcify: {
    enabled: false
  },
  networks: {
    sonicblaze: {
      url: `https://sonic-blaze-rpc.publicnode.com:443`,
      accounts: [process.env.OWNER_KEY]
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/un-GzvqyPc82Qvi2-rpme2BNzisYAmjP`,
      accounts: [process.env.OWNER_KEY]
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/un-GzvqyPc82Qvi2-rpme2BNzisYAmjP`,
      accounts: [process.env.OWNER_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sonicblaze: SONIC_API_KEY,
      polygon: POLYGON_API_KEY,
      sepolia: ETHERSCAN_API_KEY
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
