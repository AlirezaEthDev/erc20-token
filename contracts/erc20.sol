// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import "../interface/IERC165.sol";

contract ERC20 is IERC165{

    address public owner;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    mapping(address => uint256) private balanceList;
    mapping(address => mapping(address => uint256)) private approveList;
    mapping(address => address) private whoIsApprovedBy;

    error theRequesterIsNotAuthorized();
    error theBalanceIsNotEnoughToTransferOrApprove();
    error yourApprovedValueToTransferIsLessThanValueYouWant();

    modifier onlyAuthorizedAccount(address authorizedAddress) {
        if(authorizedAddress == msg.sender || whoIsApprovedBy[authorizedAddress] == msg.sender){
            _;
        }else{
            revert theRequesterIsNotAuthorized();
        }
    }

    modifier balanceCheck(address requester, uint256 requestValue) {
        if(balanceList[requester] >= requestValue){
            _;
        }else{
            revert theBalanceIsNotEnoughToTransferOrApprove();
        }
    }

    constructor(string memory tokenName, string memory tokenSymbol, uint8 unitDecimals, uint256 totalSupplyAmount) {
        owner = msg.sender;
        name = tokenName;
        symbol = tokenSymbol;
        decimals = unitDecimals;
        totalSupply = totalSupplyAmount;
        balanceList[owner] = totalSupply;
        emit Transfer(address(0x0), owner, totalSupply);
    }

    function supportsInterface(bytes4 interfaceID) external override pure returns(bool){
        bool ierc165Id = (interfaceID == this.supportsInterface.selector);
        bool ierc20Id = (interfaceID == this.totalSupply.selector ^ this.balanceOf.selector ^ this.transfer.selector ^ this.transferFrom.selector ^ this.approve.selector ^ this.allowance.selector);
        return (ierc165Id || ierc20Id);
    }

    function balanceOf(address _owner) external view returns(uint256) {
        return balanceList[_owner];
    }

    function transfer(address _to, uint256 _value) external balanceCheck(msg.sender, _value) returns(bool) {
        unchecked {
            balanceList[msg.sender] -= _value;
            balanceList[_to] += _value;
        }
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external onlyAuthorizedAccount(_from)  balanceCheck(_from, _value) returns(bool) {
        if (_from != msg.sender){
            if(approveList[_from][msg.sender] < _value){
                revert yourApprovedValueToTransferIsLessThanValueYouWant();
            }
            unchecked {
                approveList[_from][msg.sender] -= _value;
            }
        }
        unchecked {
            balanceList[_from] -= _value;
            balanceList[_to] += _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) external balanceCheck(msg.sender, _value) returns(bool) {
        approveList[msg.sender][_spender]  = _value;
        whoIsApprovedBy[msg.sender] = _spender;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) external view returns(uint256) {
        return approveList[_owner][ _spender];
    }

    function mint(uint256 _value) external onlyAuthorizedAccount(owner){
        totalSupply += _value;
        balanceList[owner] += _value;
        emit Transfer(address(0x0), owner, _value);
    }

    function burn(uint256 _value) external onlyAuthorizedAccount(owner) balanceCheck(owner, _value){
        totalSupply -= _value;
        balanceList[owner] -= _value;
        emit Transfer(owner, address(0x0), _value);
    }

}