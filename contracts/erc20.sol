// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import { IERC20 } from './interfaces/IERC20.sol';
import { IERC165 } from './interfaces/IERC165.sol';
import { IERC20Metadata } from './interfaces/IERC20Metadata.sol';
import { IERC20Errors } from './interfaces/IERC6093.sol';
import { Context } from './utils/Context.sol';

/**
 * @title ERC20 Token Contract with Ownership Management
 * @author Alireza Kiakojouri: @AlirezaEthDev
 * @notice An ERC20 token implementation with mint/burn functionality and two-step ownership transfer
 * @dev Implements ERC20, ERC20Metadata, ERC165 interfaces with custom ownership and security features
 */
contract ERC20 is IERC20, IERC165, IERC20Metadata, IERC20Errors, Context {

    // ==================== STATE VARIABLES ====================

    /// @notice Current owner of the contract with exclusive minting privileges
    address public owner;

    /// @notice Address nominated to become the new owner (two-step transfer pattern)
    address public pendingOwner;

    /// @dev Token name storage
    string private _name_;

    /// @dev Token symbol storage
    string private _symbol_;

    /// @dev Token decimal places
    uint8 private _decimals_;

    /// @dev Total supply of tokens in circulation
    uint256 private _totalSupply_;

    // ==================== EVENTS ====================

    /**
     * @notice Emitted when a new pending owner is set
     * @param _pendingOwner Address of the newly nominated owner
     */
    event NewPendingOwnerSet(address _pendingOwner);

    /**
     * @notice Emitted when ownership transfer is completed
     * @param _newOwner Address of the new owner
     * @param _pendingOwner Previous pending owner (now cleared)
     */
    event OwnerChanged(address _newOwner, address _pendingOwner);

    /**
    * @notice Emitted when token name updated only by owner
    * @param _name The new name of the token
     */
    event TokenNameChanged(string _name);

    /**
    * @notice Emitted when token symbol updated only by owner
    * @param _symbol The new symbol of the token
     */
    event TokenSymbolChanged(string _symbol);

    /**
    * @notice Emitted when token decimals value updated only by owner
    * @param _decimals The new decimals value of the token
     */
    event TokenDecimalsChanged(uint8 _decimals);

    /**
     * @notice Emitted when tokens are minted
     * @param _mintValue Amount of tokens minted
     * @param _supplyValue New total supply after minting
     */
    event Mint(uint256 _mintValue, uint256 _supplyValue);

    /**
     * @notice Emitted when tokens are burned
     * @param _burnValue Amount of tokens burned
     * @param _supplyValue New total supply after burning
     */
    event Burn(uint256 _burnValue, uint256 _supplyValue);

    // ==================== MAPPINGS ====================

    /// @dev Mapping of addresses to their token balances
    mapping(address => uint256) private balanceList;

    /// @dev Mapping of token allowances (owner => spender => amount)
    mapping(address => mapping(address => uint256)) private allowanceList;

    /// @dev Mapping to track who approved whom (informational)
    mapping(address => mapping(address => bool)) private approvedList;


    // ==================== CUSTOM ERRORS ====================

    /**
     * @notice Thrown when a non-owner tries to call an owner-only function
     * @param _owner Address of the current owner
     * @param _sender Address that attempted the action
     */
    error OnlyOwner(address _owner, address _sender);

    /**
     * @notice Thrown when trying to set zero address as pending owner
     * @param _setAddr The invalid address that was attempted to be set
     */
    error ZeroPendingOwner(address _setAddr);

    /**
     * @notice Thrown when a non-pending owner tries to claim ownership
     * @param _pendingOwner Address of the current pending owner
     * @param _yourAddress Address that attempted to claim ownership
     */
    error OnlyPendingPwner(address _pendingOwner, address _yourAddress);

    /**
    * @notice Thrown when overflow happened for the balance of to address 
    * @param _to Address of transfer destination
    * @param _balance Balance of transfer destination
    * @param _transValue Amount of token to transfer
     */
    error DestinationBalanceMax(address _to, uint256 _balance, uint256 _transValue);

    // ==================== MODIFIERS ====================

    /**
     * @notice Restricts function access to contract owner only
     * @dev Reverts with OnlyOwner error if caller is not the owner
     */
    modifier onlyOwner() {
        address msgSender = msgSender();
        if(msgSender == owner) {
            _;
        } else {
            revert OnlyOwner(owner, msgSender);
        }
    }

    /**
     * @notice Checks if caller has sufficient balance for the requested operation
     * @dev Reverts with InsufficientBalance error if balance is insufficient
     * @param _value Amount of tokens required for the operation
     */
    modifier balanceCheck(uint256 _value) {
        address requester = msgSender();
        uint256 balance = balanceList[requester];
        if( balance >= _value){
            _;
        }else{
            revert InsufficientBalance(requester, balance, _value);
        }
    }

    /**
    * @notice Checks if overflow happens for transfer destination
    * @param _to Address of transfer destination
    * @param _value Token amount to transfer    
     */
    modifier destOverFlowCheck(address _to, uint256 _value) {
        uint256 toBalance = balanceList[_to];
        uint256 maxValue = type(uint256).max;
        if(toBalance + _value > maxValue) {
            revert DestinationBalanceMax(_to, toBalance, _value);
        } else {
            _;
        }
    }
    /**
     * @notice Validates that the sender is not the zero address
     * @dev Reverts with InvalidSender error if sender is zero address
     */
    modifier senderCheck() {
        address sender = msgSender();
        if(sender == address(0)) {
            revert InvalidSender(sender);
        } else {
            _;
        }
    }

    /**
     * @notice Validates that the recipient address is not the zero address
     * @dev Reverts with InvalidReceiver error if recipient is zero address
     * @param _to Address to validate as recipient
     */
    modifier receiptCheck(address _to) {
        if(_to == address(0)) {
            revert InvalidReceiver(_to);
        } else {
            _;
        }
    }

    /**
     * @notice Validates that the approver is not the zero address
     * @dev Reverts with InvalidApprover error if approver is zero address
     */
    modifier approverCheck() {
        address approver = msgSender();
        if(approver == address(0)) {
            revert InvalidApprover(approver);
        } else {
            _;
        }
    }

    /**
     * @notice Validates that the spender address is not msgSender, the owner, or the zero address
     * @dev Reverts with InvalidSpender error if spender is msgSender, the owner, or the zero address
     * @param _spender Address to validate as spender
     */
    modifier spenderCheck(address _spender) {
        address msgSender = msgSender();
        if(_spender != msgSender && _spender != owner && _spender != address(0)) {
            _;
        } else {
            revert InvalidSpender(_spender);
        }
    }

    // ==================== CONSTRUCTOR ====================

    /**
     * @notice Initializes the ERC20 token with metadata and sets deployer as owner
     * @dev Total supply starts at zero - tokens must be minted after deployment
     * @param tokenName The human-readable name of the token
     * @param tokenSymbol The symbol/ticker of the token (usually 3-4 characters)
     * @param unitDecimals Number of decimal places for token precision (typically 18)
     */
    constructor(string memory tokenName, string memory tokenSymbol, uint8 unitDecimals) {
        owner = msgSender();
        _name_ = tokenName;
        _symbol_ = tokenSymbol;
        _decimals_ = unitDecimals;
    }

    // ==================== ERC165 INTERFACE ====================

    /**
     * @notice Query if a contract implements an interface
     * @dev Interface identification is specified in ERC-165
     * @param interfaceID The interface identifier to check
     * @return true if the interface is supported, false otherwise
     */
    function supportsInterface(bytes4 interfaceID) external override pure returns(bool){
        bool ierc165Id = (interfaceID == this.supportsInterface.selector);
        bool ierc20Id = (interfaceID == this.totalSupply.selector ^ this.balanceOf.selector ^ this.transfer.selector ^ this.transferFrom.selector ^ this.approve.selector ^ this.allowance.selector);
        return (ierc165Id || ierc20Id);
    }

    // ==================== OWNERSHIP MANAGEMENT ====================

    /**
     * @notice Nominates a new address to become the contract owner (step 1 of 2)
     * @dev Only current owner can nominate. New owner must call changeOwner() to complete transfer
     * @param _pendingOwner Address to nominate as the new owner
     * @custom:security Two-step ownership transfer prevents accidental loss of ownership
     */
    function setPendingOwner(address _pendingOwner) external onlyOwner {
        if(_pendingOwner != address(0)) {
            pendingOwner = _pendingOwner;
            emit NewPendingOwnerSet(pendingOwner);
        } else {
            revert ZeroPendingOwner(_pendingOwner);
        }

    }

    /**
     * @notice Completes the ownership transfer (step 2 of 2)
     * @dev Only the nominated pending owner can call this function
     * @custom:security Prevents ownership transfer to unintended addresses
     */
    function changeOwner() external {
        address msgSender = msgSender();
        if(msgSender == pendingOwner) {
            owner = pendingOwner;
            pendingOwner = address(0);
            emit OwnerChanged(owner, pendingOwner);
        } else {
            revert OnlyPendingPwner(pendingOwner, msgSender);
        }
    }

    /**
    * @notice Updates the name of token
    * @dev Only owner can call this function
    * @param _name New name for this token 
     */
    function changeName(string memory _name) external onlyOwner {
        _name_ = _name;
        emit TokenNameChanged(_name_);
    }

    /**
    * @notice Updates the symbol of token
    * @dev Only owner can call this function
    * @param _symbol New symbol for this token 
     */
    function changeSymbol(string memory _symbol) external onlyOwner {
        _symbol_ = _symbol;
        emit TokenSymbolChanged(_symbol_);
    }

    /**
    * @notice Resets the decimals of token
    * @dev Only owner can call this function
    * @param _decimals New value for decimals of token 
     */
    function changeDecimals(uint8 _decimals) external onlyOwner {
        _decimals_ = _decimals;
        emit TokenDecimalsChanged(_decimals_);
    }
    
    // ==================== ERC20 CORE FUNCTIONS ====================

    /**
     * @notice Returns the token balance of a specific address
     * @dev Implements ERC20 balanceOf function
     * @param _owner Address to query the balance of
     * @return The number of tokens owned by the address
     */
    function balanceOf(address _owner) external view returns(uint256) {
        return balanceList[_owner];
    }

    /**
     * @notice Transfers tokens from caller to recipient
     * @dev Implements ERC20 transfer function with additional security checks
     * @param _to Recipient address
     * @param _value Amount of tokens to transfer
     * @return true if transfer succeeded
     */
    function transfer(address _to, uint256 _value) external senderCheck receiptCheck(_to) balanceCheck(_value) destOverFlowCheck(_to, _value) returns(bool) {
        address msgSender = msgSender();
        unchecked {
            balanceList[msgSender] -= _value;
            balanceList[_to] += _value;
        }
        emit Transfer(msgSender, _to, _value);
        return true;
    }

    /**
     * @notice Transfers tokens from one address to another using allowance mechanism
     * @dev Implements ERC20 transferFrom function with comprehensive validation
     * @param _from Address to transfer tokens from
     * @param _to Address to transfer tokens to
     * @param _value Amount of tokens to transfer
     * @return true if transfer succeeded
     */
    function transferFrom(address _from, address _to, uint256 _value) external destOverFlowCheck(_to, _value) returns(bool) {
        if(_from != address(0)){
            if(_to != address (0)) {
                address msgSender = msgSender();
                uint256 balance = balanceList[_from];
                if(balance >= _value) {
                    if (_from != msgSender){
                        if(approvedList[_from][msgSender]) {
                            uint256 appAmount = allowanceList[_from][msgSender];
                            if(appAmount < _value){
                                revert InsufficientAllowance(msgSender, appAmount, _value);
                            }
                            unchecked {
                                allowanceList[_from][msgSender] -= _value;
                            }
                        } else {
                            revert InvalidSender(msgSender);
                        }
                    }
                    unchecked {
                        balanceList[_from] -= _value;
                        balanceList[_to] += _value;
                    }
                    emit Transfer(_from, _to, _value);
                    return true;
                } else {
                    revert InsufficientBalance(msgSender, balance, _value);
                }
            } else {
                revert InvalidReceiver(_to);
            }
        } else {
            revert InvalidSender(_from);
        }
    }

    /**
     * @notice Approves spender to transfer tokens on behalf of caller
     * @dev Implements ERC20 approve function with balance validation
     * @param _spender Address authorized to spend tokens
     * @param _value Maximum amount of tokens spender can transfer
     * @return true if approval succeeded
     */
    function approve(address _spender, uint256 _value) external approverCheck spenderCheck(_spender) balanceCheck(_value) returns(bool) {
        address msgSender = msgSender();
        approvedList[msgSender][_spender] = true;
        allowanceList[msgSender][_spender]  += _value;
        emit Approval(msgSender, _spender, _value);
        return true;
    }

    /**
     * @notice Returns the amount of tokens that spender is allowed to transfer from owner
     * @dev Implements ERC20 allowance function
     * @param _owner Address that owns the tokens
     * @param _spender Address authorized to spend the tokens
     * @return The number of tokens spender is allowed to transfer
     */
    function allowance(address _owner, address _spender) external view returns(uint256) {
        return allowanceList[_owner][ _spender];
    }

    // ==================== MINTING & BURNING ====================

    /**
     * @notice Creates new tokens and assigns them to specified address
     * @dev Only owner can mint tokens. Increases total supply
     * @param _to Address to receive the newly minted tokens
     * @param _value Amount of tokens to mint
     * @custom:security Only owner can mint to prevent unauthorized token creation
     */
    function mint(address _to, uint256 _value) external onlyOwner receiptCheck(_to){
        _totalSupply_ += _value;
        balanceList[_to] += _value;
        emit Mint(_value, _totalSupply_);
        emit Transfer(address(0), _to, _totalSupply_);
    }

    /**
     * @notice Destroys tokens from caller's balance
     * @dev Anyone can burn their own tokens. Decreases total supply
     * @param _value Amount of tokens to burn
     * @custom:security Users can only burn their own tokens
     */
    function burn(uint256 _value) external senderCheck balanceCheck(_value){
        address msgSender = msgSender();
        _totalSupply_ -= _value;
        balanceList[msgSender] -= _value;
        emit Burn(_value, _totalSupply_);
        emit Transfer(msgSender, address(0), _totalSupply_);
    }

    // ==================== ERC20 METADATA ====================

    /**
     * @notice Returns the human-readable name of the token
     * @dev Implements ERC20Metadata name function
     * @return The token name as a string
     */
    function name() external view returns (string memory) {
        return _name_;
    }

    /**
     * @notice Returns the symbol/ticker of the token
     * @dev Implements ERC20Metadata symbol function
     * @return The token symbol as a string
     */
    function symbol() external view returns (string memory) {
        return _symbol_;
    }

    /**
     * @notice Returns the number of decimal places used by the token
     * @dev Implements ERC20Metadata decimals function
     * @return The number of decimals as uint8
     */
    function decimals() external view returns (uint8) {
        return _decimals_;
    }

    /**
     * @notice Returns the total amount of tokens in circulation
     * @dev Implements ERC20 totalSupply function
     * @return The total supply as uint256
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply_;
    }

    /**
    * @notice Shows if a spender approved by an owner
    * @param _owner Address of owner that approved a spender
    * @param _spender Address of spender that approved by an owner
     */
    function approvement(address _owner, address _spender) external view returns (bool) {
        return approvedList[_owner][_spender];
    }
    
}