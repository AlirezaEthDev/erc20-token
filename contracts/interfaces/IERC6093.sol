// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4;

interface IERC20Errors {
    error InsufficientBalance(address _sender, uint256 _balance, uint256 _needed);
    error InvalidSender(address _sender);
    error InvalidReceiver(address _receiver);
    error InsufficientAllowance(address _spender, uint256 _allowance, uint256 _needed);
    error InvalidApprover(address _approver);
    error InvalidSpender(address _spender);
}
