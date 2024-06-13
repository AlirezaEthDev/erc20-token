# ERC20 Token Contract
This is an implementation of the ERC20 token standard in Solidity. It provides basic functionality for creating, transferring, and managing tokens.

# Overview
 * Owner: The owner of the contract is the address that created it.
 * Name: The name of the token.
 * Symbol: The symbol of the token.
 * Decimals: The number of decimal places for the token.
 * Total Supply: The total number of tokens in circulation.

# Features

  * Compliance: The project is fully compliant with the ERC20 token standard.
  * Customization: Users can customize the token name, symbol, and decimal places.
  * Initial Supply: The project allows users to set an initial supply and distribute tokens.
  * Token Transfers: The project supports token transfers, approvals, and allowances.
  * Basic Token Sale: The project includes a basic token sale functionality.
  * Documentation: The project includes comprehensive documentation and examples.

# Contract Components

Functions:

 * `balanceOf(address _owner)`: Returns the balance of a specific address.
 * `transfer(address _to, uint256 _value)`: Transfers tokens from the owner to another address. The owner must be the sender.
 * `transferFrom(address _from, address _to, uint256 _value)`: Transfers tokens from one address to another. The sender must be authorized by the `_from` address.
 * `approve(address _spender, uint256 _value)`: Approves a specific address to spend a certain amount of tokens on behalf of the sender.
 * `allowance(address _owner, address _spender)`: Returns the amount of tokens that a specific address is allowed to spend on behalf of the owner.

*****************************************************************

Modifiers:

 * `onlyAuthorizedAccount(address authorizedAddress)`: Ensures that only authorized addresses can perform specific actions.
 * `balanceCheck(address requester, uint256 requestValue)`: Checks if the balance of the requester is sufficient for the requested action.

********************************************************************

Events:

 * `Transfer(address indexed _from, address indexed _to, uint256 _value)`: Emitted when tokens are transferred.
 * `Approval(address indexed _owner, address indexed _spender, uint256 _value)`: Emitted when an address is approved to spend tokens.

# Usage
 * Deploy the contract: Deploy the contract on a blockchain network.
 * Set the token details: Set the token name, symbol, decimals, and total supply in the constructor.
 * Transfer tokens: Use the `transfer()` or `transferFrom()` functions to transfer tokens.
 * Approve spending: Use the `approve()` function to approve an address to spend tokens on behalf of the sender.

# License

This project is licensed under the MIT License.

