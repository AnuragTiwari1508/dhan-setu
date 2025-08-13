// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DhanSetuPayment
 * @dev Main payment contract for crypto payments
 */
contract DhanSetuPayment is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct Payment {
        address merchant;
        address customer;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        string paymentId;
        string description;
    }
    
    mapping(string => Payment) public payments;
    mapping(address => uint256) public merchantBalances;
    mapping(address => string[]) public merchantPayments;
    
    uint256 public feePercentage = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;
    
    event PaymentCreated(
        string indexed paymentId,
        address indexed merchant,
        address token,
        uint256 amount,
        string description
    );
    
    event PaymentCompleted(
        string indexed paymentId,
        address indexed customer,
        uint256 amount,
        uint256 fee
    );
    
    event FeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Create a new payment request
     */
    function createPayment(
        string memory paymentId,
        address token,
        uint256 amount,
        string memory description
    ) external {
        require(bytes(paymentId).length > 0, "Invalid payment ID");
        require(amount > 0, "Amount must be greater than 0");
        require(payments[paymentId].merchant == address(0), "Payment ID already exists");
        
        payments[paymentId] = Payment({
            merchant: msg.sender,
            customer: address(0),
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            completed: false,
            paymentId: paymentId,
            description: description
        });
        
        merchantPayments[msg.sender].push(paymentId);
        
        emit PaymentCreated(paymentId, msg.sender, token, amount, description);
    }
    
    /**
     * @dev Complete a payment
     */
    function completePayment(string memory paymentId) external payable nonReentrant {
        Payment storage payment = payments[paymentId];
        require(payment.merchant != address(0), "Payment not found");
        require(!payment.completed, "Payment already completed");
        require(payment.amount > 0, "Invalid payment amount");
        
        uint256 fee = (payment.amount * feePercentage) / FEE_DENOMINATOR;
        uint256 merchantAmount = payment.amount - fee;
        
        if (payment.token == address(0)) {
            // ETH payment
            require(msg.value >= payment.amount, "Insufficient ETH sent");
            
            // Transfer fee to fee recipient
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            
            // Transfer amount to merchant
            payable(payment.merchant).transfer(merchantAmount);
            
            // Refund excess
            if (msg.value > payment.amount) {
                payable(msg.sender).transfer(msg.value - payment.amount);
            }
        } else {
            // ERC20 payment
            IERC20 token = IERC20(payment.token);
            require(token.balanceOf(msg.sender) >= payment.amount, "Insufficient token balance");
            require(token.allowance(msg.sender, address(this)) >= payment.amount, "Insufficient allowance");
            
            // Transfer tokens from customer
            token.safeTransferFrom(msg.sender, address(this), payment.amount);
            
            // Transfer fee to fee recipient
            if (fee > 0) {
                token.safeTransfer(feeRecipient, fee);
            }
            
            // Transfer amount to merchant
            token.safeTransfer(payment.merchant, merchantAmount);
        }
        
        payment.customer = msg.sender;
        payment.completed = true;
        merchantBalances[payment.merchant] += merchantAmount;
        
        emit PaymentCompleted(paymentId, msg.sender, payment.amount, fee);
    }
    
    /**
     * @dev Get payment details
     */
    function getPayment(string memory paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }
    
    /**
     * @dev Get merchant payments
     */
    function getMerchantPayments(address merchant) external view returns (string[] memory) {
        return merchantPayments[merchant];
    }
    
    /**
     * @dev Update fee percentage (only owner)
     */
    function updateFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        feePercentage = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Update fee recipient (only owner)
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
}
