// SPDX-License-Identifier: MIT

pragma solidity ^0.5.12;

contract ERC20{

    address public owner;
    bytes public name;
    bytes public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    mapping(address => uint256) private balanceList;
    mapping(address => mapping(address => uint256)) private approveList;
    mapping(address => address) private whoIsApprovedBy;

    modifier onlyAuthorizedAccount(address authorizedAddress) {
        require( authorizedAddress == msg.sender || whoIsApprovedBy[authorizedAddress] == msg.sender, "01");
        // 01: The requester is not authorized!
        _;
    }

    modifier balanceCheck(address requester, uint256 requestValue) {
        require(balanceList[requester] >= requestValue, "02");
        // 02: The balance is not enough to transfer or approve
        _;
    }

    constructor(bytes memory tokenName, bytes memory tokenSymbol, uint8 unitDecimals, uint256 totalSupplyAmount) public {
        owner = msg.sender;
        name = tokenName;
        symbol = tokenSymbol;
        decimals = unitDecimals;
        totalSupply = totalSupplyAmount;
        balanceList[owner] = totalSupply;
        emit Transfer(address(0x0), owner, totalSupply);
    }

    function balanceOf(address _owner) external view returns(uint256) {
        return balanceList[_owner];
    }

    function transfer(address _to, uint256 _value) external onlyAuthorizedAccount(owner) balanceCheck(owner, _value) returns(bool) {
        if (owner != msg.sender){
            approveList[owner][msg.sender] -= _value;
        }
        balanceList[owner] -= _value;
        balanceList[_to] += _value;
        emit Transfer(owner, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external onlyAuthorizedAccount(_from)  balanceCheck(_from, _value) returns(bool) {
        if (_from != msg.sender){
            approveList[_from][msg.sender] -= _value;
        }
        balanceList[_from] -= _value;
        balanceList[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) external balanceCheck(msg.sender, _value) returns(bool) {
        approveList[msg.sender][_spender]  = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) external view returns(uint256) {
        return approveList[_owner][ _spender];
    }

}