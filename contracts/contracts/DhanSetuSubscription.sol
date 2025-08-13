// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DhanSetuSubscription
 * @dev ERC-948 compatible subscription contract
 */
contract DhanSetuSubscription is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct SubscriptionPlan {
        address merchant;
        address token;
        uint256 amount;
        uint256 interval; // in seconds
        bool active;
        string name;
        string description;
    }
    
    struct Subscription {
        address subscriber;
        uint256 planId;
        uint256 nextPayment;
        uint256 lastPayment;
        bool active;
        uint256 totalPaid;
        uint256 paymentCount;
    }
    
    mapping(uint256 => SubscriptionPlan) public plans;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(address => uint256[]) public merchantPlans;
    
    uint256 public nextPlanId = 1;
    uint256 public nextSubscriptionId = 1;
    uint256 public feePercentage = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;
    
    event PlanCreated(
        uint256 indexed planId,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 interval,
        string name
    );
    
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        uint256 indexed planId,
        address indexed subscriber
    );
    
    event PaymentProcessed(
        uint256 indexed subscriptionId,
        uint256 amount,
        uint256 fee,
        uint256 nextPayment
    );
    
    event SubscriptionCancelled(uint256 indexed subscriptionId);
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Create a subscription plan
     */
    function createPlan(
        address token,
        uint256 amount,
        uint256 interval,
        string memory name,
        string memory description
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(interval > 0, "Interval must be greater than 0");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        uint256 planId = nextPlanId++;
        
        plans[planId] = SubscriptionPlan({
            merchant: msg.sender,
            token: token,
            amount: amount,
            interval: interval,
            active: true,
            name: name,
            description: description
        });
        
        merchantPlans[msg.sender].push(planId);
        
        emit PlanCreated(planId, msg.sender, token, amount, interval, name);
        
        return planId;
    }
    
    /**
     * @dev Subscribe to a plan
     */
    function subscribe(uint256 planId) external payable nonReentrant returns (uint256) {
        SubscriptionPlan storage plan = plans[planId];
        require(plan.merchant != address(0), "Plan not found");
        require(plan.active, "Plan is not active");
        
        uint256 subscriptionId = nextSubscriptionId++;
        uint256 nextPayment = block.timestamp + plan.interval;
        
        // Process first payment
        _processPayment(plan, msg.sender);
        
        subscriptions[subscriptionId] = Subscription({
            subscriber: msg.sender,
            planId: planId,
            nextPayment: nextPayment,
            lastPayment: block.timestamp,
            active: true,
            totalPaid: plan.amount,
            paymentCount: 1
        });
        
        userSubscriptions[msg.sender].push(subscriptionId);
        
        emit SubscriptionCreated(subscriptionId, planId, msg.sender);
        
        return subscriptionId;
    }
    
    /**
     * @dev Process subscription payment
     */
    function processSubscriptionPayment(uint256 subscriptionId) external nonReentrant {
        Subscription storage subscription = subscriptions[subscriptionId];
        require(subscription.subscriber != address(0), "Subscription not found");
        require(subscription.active, "Subscription is not active");
        require(block.timestamp >= subscription.nextPayment, "Payment not due yet");
        
        SubscriptionPlan storage plan = plans[subscription.planId];
        require(plan.active, "Plan is not active");
        
        // Process payment
        _processPayment(plan, subscription.subscriber);
        
        // Update subscription
        subscription.lastPayment = block.timestamp;
        subscription.nextPayment = block.timestamp + plan.interval;
        subscription.totalPaid += plan.amount;
        subscription.paymentCount++;
        
        uint256 fee = (plan.amount * feePercentage) / FEE_DENOMINATOR;
        
        emit PaymentProcessed(subscriptionId, plan.amount, fee, subscription.nextPayment);
    }
    
    /**
     * @dev Cancel subscription
     */
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage subscription = subscriptions[subscriptionId];
        require(subscription.subscriber == msg.sender, "Not authorized");
        require(subscription.active, "Subscription already cancelled");
        
        subscription.active = false;
        
        emit SubscriptionCancelled(subscriptionId);
    }
    
    /**
     * @dev Internal function to process payment
     */
    function _processPayment(SubscriptionPlan storage plan, address payer) internal {
        uint256 fee = (plan.amount * feePercentage) / FEE_DENOMINATOR;
        uint256 merchantAmount = plan.amount - fee;
        
        if (plan.token == address(0)) {
            // ETH payment
            require(msg.value >= plan.amount, "Insufficient ETH sent");
            
            // Transfer fee to fee recipient
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            
            // Transfer amount to merchant
            payable(plan.merchant).transfer(merchantAmount);
            
            // Refund excess
            if (msg.value > plan.amount) {
                payable(payer).transfer(msg.value - plan.amount);
            }
        } else {
            // ERC20 payment
            IERC20 token = IERC20(plan.token);
            require(token.balanceOf(payer) >= plan.amount, "Insufficient token balance");
            require(token.allowance(payer, address(this)) >= plan.amount, "Insufficient allowance");
            
            // Transfer tokens from payer
            token.safeTransferFrom(payer, address(this), plan.amount);
            
            // Transfer fee to fee recipient
            if (fee > 0) {
                token.safeTransfer(feeRecipient, fee);
            }
            
            // Transfer amount to merchant
            token.safeTransfer(plan.merchant, merchantAmount);
        }
    }
    
    /**
     * @dev Get subscription details
     */
    function getSubscription(uint256 subscriptionId) external view returns (Subscription memory) {
        return subscriptions[subscriptionId];
    }
    
    /**
     * @dev Get plan details
     */
    function getPlan(uint256 planId) external view returns (SubscriptionPlan memory) {
        return plans[planId];
    }
    
    /**
     * @dev Get user subscriptions
     */
    function getUserSubscriptions(address user) external view returns (uint256[] memory) {
        return userSubscriptions[user];
    }
    
    /**
     * @dev Get merchant plans
     */
    function getMerchantPlans(address merchant) external view returns (uint256[] memory) {
        return merchantPlans[merchant];
    }
    
    /**
     * @dev Check if subscription payment is due
     */
    function isPaymentDue(uint256 subscriptionId) external view returns (bool) {
        Subscription storage subscription = subscriptions[subscriptionId];
        return subscription.active && block.timestamp >= subscription.nextPayment;
    }
    
    /**
     * @dev Update fee percentage (only owner)
     */
    function updateFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        feePercentage = newFee;
    }
    
    /**
     * @dev Update fee recipient (only owner)
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }
    
    /**
     * @dev Deactivate plan (only merchant)
     */
    function deactivatePlan(uint256 planId) external {
        SubscriptionPlan storage plan = plans[planId];
        require(plan.merchant == msg.sender, "Not authorized");
        plan.active = false;
    }
}
