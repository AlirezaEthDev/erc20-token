# ERC20 Token Contract

This is a comprehensive implementation of the ERC20 token standard in Solidity with advanced ownership management, mint/burn functionality, and enhanced security features.

## Overview

- **Author**: Alireza Kiakojouri (@AlirezaEthDev)
- **License**: MIT
- **Solidity Version**: ^0.8.27
- **Owner**: The contract owner has exclusive minting privileges and uses a secure two-step ownership transfer pattern
- **Name**: Customizable token name set during deployment
- **Symbol**: Customizable token symbol set during deployment  
- **Decimals**: Customizable decimal places for token precision
- **Total Supply**: Dynamic total supply that changes with mint/burn operations (starts at zero)

## Features

- **Full ERC20 Compliance**: Implements all standard ERC20 functions and events
- **ERC20Metadata Support**: Includes name, symbol, and decimals functionality
- **ERC165 Interface Detection**: Supports interface identification standard
- **Two-Step Ownership Transfer**: Secure ownership management with pending owner mechanism
- **Mint/Burn Functionality**: Owner can mint tokens, users can burn their own tokens
- **Advanced Security**: Comprehensive input validation and custom error handling
- **Zero Address Protection**: Prevents transfers to/from zero addresses
- **Balance & Allowance Checks**: Built-in validation for sufficient balances and allowances
- **Gas Optimized**: Uses unchecked arithmetic where safe for gas efficiency

## Contract Architecture

### State Variables

- `owner`: Current contract owner with minting privileges
- `pendingOwner`: Address nominated for ownership transfer
- `_name_`, `_symbol_`, `_decimals_`: Token metadata
- `_totalSupply_`: Current total token supply
- `balanceList`: Mapping of address balances
- `approveList`: Nested mapping for token allowances
- `whoIsApprovedBy`: Tracking mapping for approval relationships

### Events

**Ownership Events:**
- `NewPendingOwnerSet(address _pendingOwner)`: Emitted when a new pending owner is nominated
- `OwnerChanged(address _newOwner, address _pendingOwner)`: Emitted when ownership transfer completes

**Token Supply Events:**
- `Mint(uint256 _mintValue, uint256 _supplyValue)`: Emitted when tokens are minted
- `Burn(uint256 _burnValue, uint256 _supplyValue)`: Emitted when tokens are burned

**Standard ERC20 Events:**
- `Transfer(address indexed _from, address indexed _to, uint256 _value)`: Token transfers
- `Approval(address indexed _owner, address indexed _spender, uint256 _value)`: Token approvals

### Custom Errors

- `OnlyOwner(address _owner, address _sender)`: Unauthorized owner function access
- `ZerpPendingOwner(address _setAddr)`: Invalid zero address for pending owner
- `OnlyPendingPwner(address _pendingOwner, address _yourAddress)`: Unauthorized ownership claim
- Plus standard ERC6093 errors for transfers, approvals, and balance validations

### Security Modifiers

- `onlyOwner()`: Restricts access to contract owner only
- `balanceCheck(uint256 _requestValue)`: Validates sufficient balance for operations
- `senderCheck()`: Prevents zero address as sender
- `receiptCheck(address _to)`: Prevents zero address as recipient
- `approverCheck()`: Validates approver is not zero address
- `spenderCheck(address _spender)`: Validates spender is not zero address

## Core Functions

### ERC20 Standard Functions

- `balanceOf(address _owner)`: Returns token balance of specified address
- `transfer(address _to, uint256 _value)`: Transfers tokens from caller to recipient
- `transferFrom(address _from, address _to, uint256 _value)`: Transfers tokens using allowance mechanism
- `approve(address _spender, uint256 _value)`: Approves spender to transfer tokens on behalf of caller
- `allowance(address _owner, address _spender)`: Returns approved allowance amount
- `totalSupply()`: Returns current total supply of tokens

### ERC20Metadata Functions

- `name()`: Returns human-readable token name
- `symbol()`: Returns token symbol/ticker
- `decimals()`: Returns number of decimal places

### Ownership Management

- `setPendingOwner(address _pendingOwner)`: Nominates new owner (step 1 of transfer)
- `changeOwner()`: Completes ownership transfer (step 2 of transfer)

### Mint/Burn Functions

- `mint(address _to, uint256 _value)`: Creates new tokens (owner only)
- `burn(uint256 _value)`: Destroys tokens from caller's balance

### Interface Support

- `supportsInterface(bytes4 interfaceID)`: ERC165 interface detection

## Usage

### Deployment

```solidity
// Deploy with custom token parameters
ERC20 token = new ERC20("My Token", "MTK", 18);
```

### Basic Operations

```solidity
// Mint initial supply (owner only)
token.mint(recipient, 1000 * 10**18);

// Transfer tokens
token.transfer(recipient, amount);

// Approve spending
token.approve(spender, amount);

// Transfer from allowance
token.transferFrom(owner, recipient, amount);

// Burn tokens
token.burn(amount);
```

### Ownership Transfer

```solidity
// Step 1: Current owner nominates new owner
token.setPendingOwner(newOwnerAddress);

// Step 2: New owner claims ownership
token.changeOwner(); // Called by pending owner
```

## Security Considerations

- **Two-Step Ownership Transfer**: Prevents accidental ownership loss
- **Zero Address Protection**: Comprehensive validation against zero addresses
- **Balance Validation**: All operations check for sufficient balances
- **Custom Errors**: Gas-efficient error handling with detailed information
- **Allowance Security**: Proper validation of spending permissions
- **Overflow Protection**: Uses Solidity 0.8+ built-in overflow protection

## Dependencies

- `IERC20.sol`: ERC20 interface
- `IERC165.sol`: ERC165 interface  
- `IERC20Metadata.sol`: ERC20Metadata interface
- `IERC6093.sol`: ERC20 error definitions
- `Context.sol`: Context utilities for meta-transactions

## License

This project is licensed under the MIT License.
