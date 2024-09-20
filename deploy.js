// Import Hardhat Runtime Environment
const hre = require("hardhat");

async function main() {
    // Get the ContractFactory for your ERC20 contract
    const ERC20 = await hre.ethers.getContractFactory("ERC20");

    // Define constructor arguments
    const tokenName = Buffer.from('MyToken','utf-8'); // Token name
    const tokenSymbol = Buffer.from('MTK','utf-8');    // Token symbol
    const decimals = 18;           // Decimals
    const totalSupplyAmount = ethers.utils.parseUnits("1000000", decimals); // Total supply (1 million tokens)

    // Deploy the contract with constructor arguments
    const erc20 = await ERC20.deploy(tokenName, tokenSymbol, decimals, totalSupplyAmount);

    // Wait for the deployment to be confirmed
    await erc20.deployed();

    // Log the address of the deployed contract
    console.log(`ERC20 Token deployed to: ${erc20.address}`);
}

// Execute the main function and handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });