// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DomainLeasing
 * @notice Enables leasing of granular domain rights using Doma Protocol Synthetic Tokens
 * @dev Manages time-based leases of specific domain permissions (DNS, nameserver, etc.)
 */
contract DomainLeasing is IERC721Receiver, ReentrancyGuard {
    enum PermissionType {
        DNS_CONTROL,
        NAMESERVER,
        SUBDOMAIN,
        PARKING
    }

    struct Lease {
        address lessor;
        address lessee;
        address syntheticToken;
        uint256 tokenId;
        PermissionType permissionType;
        uint256 rentalPrice;
        uint256 startTime;
        uint256 duration;
        bool active;
    }

    IERC20 public immutable paymentToken;
    uint256 public leaseCounter;
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    uint256 public constant BASIS_POINTS = 10000;

    mapping(uint256 => Lease) public leases;
    mapping(address => uint256[]) public lessorLeases;
    mapping(address => uint256[]) public lesseeLeases;

    event LeaseCreated(
        uint256 indexed leaseId,
        address indexed lessor,
        address indexed lessee,
        address syntheticToken,
        uint256 tokenId,
        PermissionType permissionType,
        uint256 rentalPrice,
        uint256 duration
    );

    event LeaseEnded(uint256 indexed leaseId);
    event LeaseExtended(uint256 indexed leaseId, uint256 newEndTime);

    constructor(address _paymentToken) {
        paymentToken = IERC20(_paymentToken);
    }

    /**
     * @notice Create a new lease for a synthetic domain token
     * @param syntheticToken Address of the Doma Synthetic Token contract
     * @param tokenId Token ID of the synthetic token
     * @param permissionType Type of permission being leased
     * @param rentalPrice Rental price in payment tokens
     * @param duration Lease duration in seconds
     * @param lessee Address of the lessee (0x0 for open listing)
     */
    function createLease(
        address syntheticToken,
        uint256 tokenId,
        PermissionType permissionType,
        uint256 rentalPrice,
        uint256 duration,
        address lessee
    ) external nonReentrant returns (uint256) {
        require(rentalPrice > 0, "Rental price must be positive");
        require(duration >= 1 days && duration <= 365 days, "Invalid duration");

        // Transfer synthetic token to this contract
        IERC721(syntheticToken).safeTransferFrom(msg.sender, address(this), tokenId);

        uint256 leaseId = leaseCounter++;
        leases[leaseId] = Lease({
            lessor: msg.sender,
            lessee: lessee,
            syntheticToken: syntheticToken,
            tokenId: tokenId,
            permissionType: permissionType,
            rentalPrice: rentalPrice,
            startTime: 0, // Set when lease is accepted
            duration: duration,
            active: false
        });

        lessorLeases[msg.sender].push(leaseId);

        emit LeaseCreated(
            leaseId,
            msg.sender,
            lessee,
            syntheticToken,
            tokenId,
            permissionType,
            rentalPrice,
            duration
        );

        return leaseId;
    }

    /**
     * @notice Accept and activate a lease
     * @param leaseId ID of the lease to accept
     */
    function acceptLease(uint256 leaseId) external nonReentrant {
        Lease storage lease = leases[leaseId];
        require(!lease.active, "Lease already active");
        require(
            lease.lessee == address(0) || lease.lessee == msg.sender,
            "Not authorized lessee"
        );

        uint256 platformFee = (lease.rentalPrice * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 lessorPayment = lease.rentalPrice - platformFee;

        // Transfer rental payment from lessee
        require(
            paymentToken.transferFrom(msg.sender, lease.lessor, lessorPayment),
            "Payment failed"
        );
        require(
            paymentToken.transferFrom(msg.sender, address(this), platformFee),
            "Fee payment failed"
        );

        // Transfer synthetic token to lessee
        IERC721(lease.syntheticToken).safeTransferFrom(address(this), msg.sender, lease.tokenId);

        lease.lessee = msg.sender;
        lease.startTime = block.timestamp;
        lease.active = true;

        lesseeLeases[msg.sender].push(leaseId);
    }

    /**
     * @notice End a lease and return the synthetic token to lessor
     * @param leaseId ID of the lease to end
     */
    function endLease(uint256 leaseId) external nonReentrant {
        Lease storage lease = leases[leaseId];
        require(lease.active, "Lease not active");
        require(
            msg.sender == lease.lessee ||
                msg.sender == lease.lessor ||
                block.timestamp >= lease.startTime + lease.duration,
            "Not authorized"
        );

        // Return synthetic token to lessor
        IERC721(lease.syntheticToken).safeTransferFrom(
            lease.lessee,
            lease.lessor,
            lease.tokenId
        );

        lease.active = false;

        emit LeaseEnded(leaseId);
    }

    /**
     * @notice Extend an active lease
     * @param leaseId ID of the lease to extend
     * @param additionalDuration Additional time in seconds
     * @param additionalPayment Additional payment for extension
     */
    function extendLease(
        uint256 leaseId,
        uint256 additionalDuration,
        uint256 additionalPayment
    ) external nonReentrant {
        Lease storage lease = leases[leaseId];
        require(lease.active, "Lease not active");
        require(msg.sender == lease.lessee, "Not lessee");

        uint256 platformFee = (additionalPayment * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 lessorPayment = additionalPayment - platformFee;

        // Transfer extension payment
        require(
            paymentToken.transferFrom(msg.sender, lease.lessor, lessorPayment),
            "Payment failed"
        );
        require(
            paymentToken.transferFrom(msg.sender, address(this), platformFee),
            "Fee payment failed"
        );

        lease.duration += additionalDuration;

        emit LeaseExtended(leaseId, lease.startTime + lease.duration);
    }

    /**
     * @notice Get all leases for a lessor
     * @param lessor Address of the lessor
     * @return Array of lease IDs
     */
    function getLessorLeases(address lessor) external view returns (uint256[] memory) {
        return lessorLeases[lessor];
    }

    /**
     * @notice Get all leases for a lessee
     * @param lessee Address of the lessee
     * @return Array of lease IDs
     */
    function getLesseeLeases(address lessee) external view returns (uint256[] memory) {
        return lesseeLeases[lessee];
    }

    /**
     * @notice Check if a lease is expired
     * @param leaseId ID of the lease
     * @return Boolean indicating if lease is expired
     */
    function isLeaseExpired(uint256 leaseId) external view returns (bool) {
        Lease memory lease = leases[leaseId];
        if (!lease.active) return false;
        return block.timestamp >= lease.startTime + lease.duration;
    }

    /**
     * @notice Required for receiving ERC721 tokens
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Withdraw accumulated platform fees
     */
    function withdrawFees(address recipient, uint256 amount) external {
        require(paymentToken.transfer(recipient, amount), "Withdrawal failed");
    }
}
