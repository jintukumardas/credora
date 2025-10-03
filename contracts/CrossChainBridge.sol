// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrossChainBridge
 * @notice Enables cross-chain domain transfers and liquidity bridging
 */
contract CrossChainBridge is Ownable, Pausable, ReentrancyGuard {

    enum ChainType { EVM, SOLANA, COSMOS, NEAR }
    enum BridgeStatus { PENDING, CONFIRMED, FAILED, EXPIRED }

    struct BridgeRequest {
        uint256 requestId;
        address initiator;
        uint256 domainId;
        uint256 sourceChain;
        uint256 targetChain;
        bytes32 targetAddress;
        uint256 amount;
        BridgeStatus status;
        uint256 timestamp;
        uint256 nonce;
    }

    struct ChainConfig {
        uint256 chainId;
        ChainType chainType;
        address relayer;
        uint256 minConfirmations;
        uint256 gasPrice;
        bool isActive;
    }

    struct LiquidityPool {
        uint256 totalLiquidity;
        uint256 availableLiquidity;
        uint256 lockedLiquidity;
        mapping(address => uint256) providerBalances;
    }

    // State variables
    uint256 private _requestCounter;
    uint256 public bridgeFee = 100; // 1% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant BRIDGE_TIMEOUT = 1 hours;

    // Mappings
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(uint256 => ChainConfig) public chainConfigs;
    mapping(uint256 => LiquidityPool) public liquidityPools;
    mapping(bytes32 => bool) public processedTransactions;
    mapping(address => uint256[]) public userBridgeRequests;

    // Relayer management
    mapping(address => bool) public authorizedRelayers;
    mapping(uint256 => mapping(uint256 => bool)) public bridgeRoutes;

    // Events
    event BridgeInitiated(
        uint256 indexed requestId,
        address indexed initiator,
        uint256 sourceChain,
        uint256 targetChain,
        uint256 amount
    );

    event BridgeCompleted(
        uint256 indexed requestId,
        bytes32 targetTxHash
    );

    event BridgeFailed(
        uint256 indexed requestId,
        string reason
    );

    event LiquidityAdded(
        uint256 indexed chainId,
        address indexed provider,
        uint256 amount
    );

    event LiquidityRemoved(
        uint256 indexed chainId,
        address indexed provider,
        uint256 amount
    );

    event RelayerAuthorized(address indexed relayer, bool authorized);
    event ChainConfigured(uint256 indexed chainId, ChainType chainType);
    event RouteEnabled(uint256 sourceChain, uint256 targetChain, bool enabled);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Configure a supported chain
     */
    function configureChain(
        uint256 _chainId,
        ChainType _chainType,
        address _relayer,
        uint256 _minConfirmations
    ) external onlyOwner {
        chainConfigs[_chainId] = ChainConfig({
            chainId: _chainId,
            chainType: _chainType,
            relayer: _relayer,
            minConfirmations: _minConfirmations,
            gasPrice: 0,
            isActive: true
        });

        emit ChainConfigured(_chainId, _chainType);
    }

    /**
     * @dev Enable or disable a bridge route
     */
    function configureBridgeRoute(
        uint256 _sourceChain,
        uint256 _targetChain,
        bool _enabled
    ) external onlyOwner {
        bridgeRoutes[_sourceChain][_targetChain] = _enabled;
        emit RouteEnabled(_sourceChain, _targetChain, _enabled);
    }

    /**
     * @dev Initiate a cross-chain bridge request
     */
    function initiateBridge(
        uint256 _domainId,
        uint256 _targetChain,
        bytes32 _targetAddress,
        uint256 _amount
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(chainConfigs[block.chainid].isActive, "Source chain not active");
        require(chainConfigs[_targetChain].isActive, "Target chain not active");
        require(bridgeRoutes[block.chainid][_targetChain], "Route not enabled");
        require(_amount > 0, "Invalid amount");

        uint256 fee = (_amount * bridgeFee) / FEE_DENOMINATOR;
        require(msg.value >= fee, "Insufficient fee");

        uint256 requestId = ++_requestCounter;

        bridgeRequests[requestId] = BridgeRequest({
            requestId: requestId,
            initiator: msg.sender,
            domainId: _domainId,
            sourceChain: block.chainid,
            targetChain: _targetChain,
            targetAddress: _targetAddress,
            amount: _amount,
            status: BridgeStatus.PENDING,
            timestamp: block.timestamp,
            nonce: _generateNonce()
        });

        userBridgeRequests[msg.sender].push(requestId);

        // Lock liquidity
        liquidityPools[block.chainid].availableLiquidity -= _amount;
        liquidityPools[block.chainid].lockedLiquidity += _amount;

        emit BridgeInitiated(requestId, msg.sender, block.chainid, _targetChain, _amount);

        return requestId;
    }

    /**
     * @dev Confirm bridge completion (called by relayer)
     */
    function confirmBridge(
        uint256 _requestId,
        bytes32 _targetTxHash,
        bytes calldata _signature
    ) external {
        require(authorizedRelayers[msg.sender], "Unauthorized relayer");

        BridgeRequest storage request = bridgeRequests[_requestId];
        require(request.status == BridgeStatus.PENDING, "Invalid request status");
        require(block.timestamp <= request.timestamp + BRIDGE_TIMEOUT, "Request expired");

        // Verify signature
        require(_verifyRelayerSignature(_requestId, _targetTxHash, _signature), "Invalid signature");

        // Mark as processed
        processedTransactions[_targetTxHash] = true;
        request.status = BridgeStatus.CONFIRMED;

        // Release locked liquidity
        liquidityPools[request.sourceChain].lockedLiquidity -= request.amount;

        emit BridgeCompleted(_requestId, _targetTxHash);
    }

    /**
     * @dev Cancel expired bridge request
     */
    function cancelExpiredRequest(uint256 _requestId) external {
        BridgeRequest storage request = bridgeRequests[_requestId];
        require(request.initiator == msg.sender || owner() == msg.sender, "Unauthorized");
        require(request.status == BridgeStatus.PENDING, "Invalid status");
        require(block.timestamp > request.timestamp + BRIDGE_TIMEOUT, "Not expired");

        request.status = BridgeStatus.EXPIRED;

        // Unlock liquidity
        liquidityPools[request.sourceChain].lockedLiquidity -= request.amount;
        liquidityPools[request.sourceChain].availableLiquidity += request.amount;

        // Refund user (minus fee)
        uint256 refundAmount = request.amount - (request.amount * bridgeFee) / FEE_DENOMINATOR;
        payable(request.initiator).transfer(refundAmount);

        emit BridgeFailed(_requestId, "Request expired");
    }

    /**
     * @dev Add liquidity to a chain pool
     */
    function addLiquidity(uint256 _chainId) external payable nonReentrant {
        require(chainConfigs[_chainId].isActive, "Chain not active");
        require(msg.value > 0, "Invalid amount");

        LiquidityPool storage pool = liquidityPools[_chainId];
        pool.totalLiquidity += msg.value;
        pool.availableLiquidity += msg.value;
        pool.providerBalances[msg.sender] += msg.value;

        emit LiquidityAdded(_chainId, msg.sender, msg.value);
    }

    /**
     * @dev Remove liquidity from a chain pool
     */
    function removeLiquidity(uint256 _chainId, uint256 _amount) external nonReentrant {
        LiquidityPool storage pool = liquidityPools[_chainId];
        require(pool.providerBalances[msg.sender] >= _amount, "Insufficient balance");
        require(pool.availableLiquidity >= _amount, "Insufficient liquidity");

        pool.totalLiquidity -= _amount;
        pool.availableLiquidity -= _amount;
        pool.providerBalances[msg.sender] -= _amount;

        payable(msg.sender).transfer(_amount);

        emit LiquidityRemoved(_chainId, msg.sender, _amount);
    }

    /**
     * @dev Authorize or revoke relayer
     */
    function authorizeRelayer(address _relayer, bool _authorized) external onlyOwner {
        authorizedRelayers[_relayer] = _authorized;
        emit RelayerAuthorized(_relayer, _authorized);
    }

    /**
     * @dev Get user's bridge requests
     */
    function getUserRequests(address _user) external view returns (uint256[] memory) {
        return userBridgeRequests[_user];
    }

    /**
     * @dev Get liquidity info for a chain
     */
    function getLiquidityInfo(uint256 _chainId) external view returns (
        uint256 total,
        uint256 available,
        uint256 locked
    ) {
        LiquidityPool storage pool = liquidityPools[_chainId];
        return (pool.totalLiquidity, pool.availableLiquidity, pool.lockedLiquidity);
    }

    /**
     * @dev Get provider's liquidity balance
     */
    function getProviderBalance(uint256 _chainId, address _provider) external view returns (uint256) {
        return liquidityPools[_chainId].providerBalances[_provider];
    }

    /**
     * @dev Check if route is enabled
     */
    function isRouteEnabled(uint256 _source, uint256 _target) external view returns (bool) {
        return bridgeRoutes[_source][_target];
    }

    /**
     * @dev Generate unique nonce
     */
    function _generateNonce() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _requestCounter)));
    }

    /**
     * @dev Verify relayer signature
     */
    function _verifyRelayerSignature(
        uint256 _requestId,
        bytes32 _targetTxHash,
        bytes calldata _signature
    ) private view returns (bool) {
        // Signature verification logic
        // In production, implement proper ECDSA verification
        return true;
    }

    /**
     * @dev Update bridge fee
     */
    function updateBridgeFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 500, "Fee too high"); // Max 5%
        bridgeFee = _newFee;
    }

    /**
     * @dev Pause bridge operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause bridge operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}