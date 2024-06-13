
const ERC20 = artifacts.require("./ERC20.sol");

module.exports = function(deployer) {
  const tokenName = Buffer.from("myToken","utf-8");
  const tokenSymbol = Buffer.from("MTN","utf-8");
  const unitDecimals = 10;
  const totalSupplyAmount = 1000000000;
  deployer.deploy(ERC20, tokenName, tokenSymbol, unitDecimals, totalSupplyAmount);
}
