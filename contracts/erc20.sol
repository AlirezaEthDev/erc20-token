// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import { IERC20 } from './interfaces/IERC20.sol';
import { IERC165 } from './interfaces/IERC165.sol';
import { IERC20Metadata } from './interfaces/IERC20Metadata.sol';
import { IERC20Errors } from './interfaces/IERC6093.sol';
import { Context } from './utils/Context.sol';

contract ERC20 is IERC20, IERC165, IERC20Metadata, IERC20Errors, Context {

    // Variables
    address public owner;
    address public pendingOwner;
    string private _name_;
    string private _symbol_;
    uint8 private _decimals_;
    uint256 private _totalSupply_;

    // Events
    event NewPendingOwnerSet(address _pendingOwner);
    event OwnerChanged(address _newOwner, address _pendingOwner);
    event Mint(uint256 _mintValue, uint256 _supplyValue);
    event Burn(uint256 _burnValue, uint256 _supplyValue);

    // Mappings
    mapping(address => uint256) private balanceList;
    mapping(address => mapping(address => uint256)) private approveList;
    mapping(address => address) private whoIsApprovedBy;

    // Errors
    error OnlyOwner(address _owner, address _sender);
    error ZerpPendingOwner(address _setAddr);
    error OnlyPendingPwner(address _pendingOwner, address _yourAddress);

    // Modifiers
    modifier onlyOwner() {
        address msgSender = _msgSender();
        if(msgSender == owner) {
            _;
        } else {
            revert OnlyOwner(owner, msgSender);
        }
    }

    modifier balanceCheck(uint256 _requestValue) {
        address requester = _msgSender();
        uint256 balance = balanceList[requester];
        if( balance >= _requestValue){
            _;
        }else{
            uint256 needed = _requestValue - balance;
            revert InsufficientBalance(requester, balance, needed);
        }
    }

    modifier senderCheck() {
        address sender = _msgSender();
        if(sender == address(0)) {
            revert InvalidSender(sender);
        } else {
            _;
        }
    }

    modifier receiptCheck(address _to) {
        if(_to == address(0)) {
            revert InvalidReceiver(_to);
        } else {
            _;
        }
    }

    modifier approverCheck() {
        address approver = _msgSender();
        if(approver == address(0)) {
            revert InvalidApprover(approver);
        } else {
            _;
        }
    }

    modifier spenderCheck(address _spender) {
        if(_spender == address(0)) {
            revert InvalidSpender(_spender);
        } else {
            _;
        }
    }

    // constructor
    constructor(string memory tokenName, string memory tokenSymbol, uint8 unitDecimals) {
        owner = _msgSender();
        _name_ = tokenName;
        _symbol_ = tokenSymbol;
        _decimals_ = unitDecimals;
    }

    // Functions
    // Checks this contract's interface ID
    function supportsInterface(bytes4 interfaceID) external override pure returns(bool){
        bool ierc165Id = (interfaceID == this.supportsInterface.selector);
        bool ierc20Id = (interfaceID == this.totalSupply.selector ^ this.balanceOf.selector ^ this.transfer.selector ^ this.transferFrom.selector ^ this.approve.selector ^ this.allowance.selector);
        return (ierc165Id || ierc20Id);
    }

    // Ownership
    function setPendingOwner(address _pendingOwner) external onlyOwner {
        if(_pendingOwner != address(0)) {
            pendingOwner = _pendingOwner;
            emit NewPendingOwnerSet(pendingOwner);
        } else {
            revert ZerpPendingOwner(_pendingOwner);
        }

    }

    function changeOwner() external {
        address msgSender = _msgSender();
        if(msgSender == pendingOwner) {
            owner = pendingOwner;
            pendingOwner = address(0);
            emit OwnerChanged(owner, pendingOwner);
        } else {
            revert OnlyPendingPwner(pendingOwner, msgSender);
        }
    }

    function balanceOf(address _owner) external view returns(uint256) {
        return balanceList[_owner];
    }

    function transfer(address _to, uint256 _value) external senderCheck receiptCheck(_to) balanceCheck(_value) returns(bool) {
        address msgSender = _msgSender();
        unchecked {
            balanceList[msgSender] -= _value;
            balanceList[_to] += _value;
        }
        emit Transfer(msgSender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external returns(bool) {
        if(_from != address(0)){
            if(_to != address (0)) {
                address msgSender = _msgSender();
                uint256 balance = balanceList[_from];
                uint256 appAmount = approveList[_from][msgSender];
                uint256 needed;
                if(balance >= _value) {
                    if (_from != msgSender){
                        if(appAmount < _value){
                            needed = _value - appAmount;
                            revert InsufficientAllowance(msgSender, appAmount, needed);
                        }
                        unchecked {
                            approveList[_from][msgSender] -= _value;
                        }
                    }
                    unchecked {
                        balanceList[_from] -= _value;
                        balanceList[_to] += _value;
                    }
                    emit Transfer(_from, _to, _value);
                    return true;
                } else {
                    needed = _value - balance;
                    revert InsufficientBalance(msgSender, balance, needed);
                }
            } else {
                revert InvalidReceiver(_to);
            }
        } else {
            revert InvalidSender(_from);
        }
    }

    function approve(address _spender, uint256 _value) external approverCheck spenderCheck(_spender) balanceCheck(_value) returns(bool) {
        address msgSender = _msgSender();
        approveList[msgSender][_spender]  = _value;
        whoIsApprovedBy[msgSender] = _spender;
        emit Approval(msgSender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) external view returns(uint256) {
        return approveList[_owner][ _spender];
    }

    function mint(address _to, uint256 _value) external onlyOwner receiptCheck(_to){
        _totalSupply_ += _value;
        balanceList[_to] += _value;
        emit Mint(_value, _totalSupply_);
        emit Transfer(address(0), _to, _totalSupply_);
    }

    function burn(uint256 _value) external senderCheck balanceCheck(_value){
        address msgSender = _msgSender();
        _totalSupply_ -= _value;
        balanceList[msgSender] -= _value;
        emit Burn(_value, _totalSupply_);
        emit Transfer(msgSender, address(0), _totalSupply_);
    }

    // Metadata
    function name() external view returns (string memory) {
        return _name_;
    }

    function symbol() external view returns (string memory) {
        return _symbol_;
    }

    function decimals() external view returns (uint8) {
        return _decimals_;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply_;
    }
    

}