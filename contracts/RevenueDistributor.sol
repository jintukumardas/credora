// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RevenueDistributor
 * @notice Automated on-chain yield and fee distribution for domain revenue
 * @dev Distributes domain parking yield, advertising revenue, and lease payments
 */
contract RevenueDistributor is ReentrancyGuard {
    struct RevenueStream {
        address domainNFT;
        uint256 tokenId;
        address[] beneficiaries;
        uint256[] shares; // in basis points
        uint256 totalCollected;
        uint256 totalDistributed;
        bool active;
    }

    IERC20 public immutable revenueToken;
    uint256 public streamCounter;
    uint256 public constant BASIS_POINTS = 10000;

    mapping(uint256 => RevenueStream) public streams;
    mapping(address => uint256[]) public beneficiaryStreams;
    mapping(uint256 => mapping(address => uint256)) public withdrawableAmount;

    event StreamCreated(
        uint256 indexed streamId,
        address indexed domainNFT,
        uint256 tokenId,
        address[] beneficiaries,
        uint256[] shares
    );

    event RevenueDeposited(uint256 indexed streamId, uint256 amount);
    event RevenueWithdrawn(uint256 indexed streamId, address indexed beneficiary, uint256 amount);
    event StreamUpdated(uint256 indexed streamId, address[] beneficiaries, uint256[] shares);
    event StreamDeactivated(uint256 indexed streamId);

    constructor(address _revenueToken) {
        revenueToken = IERC20(_revenueToken);
    }

    /**
     * @notice Create a new revenue distribution stream
     * @param domainNFT Address of the Domain Ownership Token
     * @param tokenId Token ID of the domain
     * @param beneficiaries Array of beneficiary addresses
     * @param shares Array of share percentages in basis points (must sum to 10000)
     */
    function createStream(
        address domainNFT,
        uint256 tokenId,
        address[] calldata beneficiaries,
        uint256[] calldata shares
    ) external returns (uint256) {
        require(beneficiaries.length > 0, "No beneficiaries");
        require(beneficiaries.length == shares.length, "Length mismatch");
        require(IERC721(domainNFT).ownerOf(tokenId) == msg.sender, "Not domain owner");

        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(beneficiaries[i] != address(0), "Invalid beneficiary");
            require(shares[i] > 0, "Invalid share");
            totalShares += shares[i];
            beneficiaryStreams[beneficiaries[i]].push(streamCounter);
        }
        require(totalShares == BASIS_POINTS, "Shares must sum to 100%");

        uint256 streamId = streamCounter++;
        streams[streamId] = RevenueStream({
            domainNFT: domainNFT,
            tokenId: tokenId,
            beneficiaries: beneficiaries,
            shares: shares,
            totalCollected: 0,
            totalDistributed: 0,
            active: true
        });

        emit StreamCreated(streamId, domainNFT, tokenId, beneficiaries, shares);

        return streamId;
    }

    /**
     * @notice Deposit revenue into a stream for distribution
     * @param streamId ID of the revenue stream
     * @param amount Amount of revenue to deposit
     */
    function depositRevenue(uint256 streamId, uint256 amount) external nonReentrant {
        RevenueStream storage stream = streams[streamId];
        require(stream.active, "Stream not active");
        require(amount > 0, "Amount must be positive");

        // Transfer revenue tokens to contract
        require(
            revenueToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        stream.totalCollected += amount;

        // Calculate and allocate shares
        for (uint256 i = 0; i < stream.beneficiaries.length; i++) {
            uint256 beneficiaryShare = (amount * stream.shares[i]) / BASIS_POINTS;
            withdrawableAmount[streamId][stream.beneficiaries[i]] += beneficiaryShare;
        }

        emit RevenueDeposited(streamId, amount);
    }

    /**
     * @notice Withdraw accumulated revenue for a beneficiary
     * @param streamId ID of the revenue stream
     */
    function withdrawRevenue(uint256 streamId) external nonReentrant {
        uint256 amount = withdrawableAmount[streamId][msg.sender];
        require(amount > 0, "No revenue to withdraw");

        withdrawableAmount[streamId][msg.sender] = 0;
        streams[streamId].totalDistributed += amount;

        require(revenueToken.transfer(msg.sender, amount), "Transfer failed");

        emit RevenueWithdrawn(streamId, msg.sender, amount);
    }

    /**
     * @notice Withdraw from multiple streams at once
     * @param streamIds Array of stream IDs to withdraw from
     */
    function batchWithdraw(uint256[] calldata streamIds) external nonReentrant {
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < streamIds.length; i++) {
            uint256 streamId = streamIds[i];
            uint256 amount = withdrawableAmount[streamId][msg.sender];

            if (amount > 0) {
                withdrawableAmount[streamId][msg.sender] = 0;
                streams[streamId].totalDistributed += amount;
                totalAmount += amount;

                emit RevenueWithdrawn(streamId, msg.sender, amount);
            }
        }

        require(totalAmount > 0, "No revenue to withdraw");
        require(revenueToken.transfer(msg.sender, totalAmount), "Transfer failed");
    }

    /**
     * @notice Update beneficiaries and shares for a stream
     * @param streamId ID of the stream to update
     * @param newBeneficiaries New array of beneficiary addresses
     * @param newShares New array of share percentages
     */
    function updateStream(
        uint256 streamId,
        address[] calldata newBeneficiaries,
        uint256[] calldata newShares
    ) external {
        RevenueStream storage stream = streams[streamId];
        require(stream.active, "Stream not active");
        require(
            IERC721(stream.domainNFT).ownerOf(stream.tokenId) == msg.sender,
            "Not domain owner"
        );
        require(newBeneficiaries.length == newShares.length, "Length mismatch");

        uint256 totalShares = 0;
        for (uint256 i = 0; i < newShares.length; i++) {
            require(newBeneficiaries[i] != address(0), "Invalid beneficiary");
            require(newShares[i] > 0, "Invalid share");
            totalShares += newShares[i];
        }
        require(totalShares == BASIS_POINTS, "Shares must sum to 100%");

        stream.beneficiaries = newBeneficiaries;
        stream.shares = newShares;

        emit StreamUpdated(streamId, newBeneficiaries, newShares);
    }

    /**
     * @notice Deactivate a revenue stream
     * @param streamId ID of the stream to deactivate
     */
    function deactivateStream(uint256 streamId) external {
        RevenueStream storage stream = streams[streamId];
        require(stream.active, "Stream already inactive");
        require(
            IERC721(stream.domainNFT).ownerOf(stream.tokenId) == msg.sender,
            "Not domain owner"
        );

        stream.active = false;

        emit StreamDeactivated(streamId);
    }

    /**
     * @notice Get withdrawable amount for a beneficiary in a stream
     * @param streamId ID of the stream
     * @param beneficiary Address of the beneficiary
     * @return Amount available to withdraw
     */
    function getWithdrawableAmount(
        uint256 streamId,
        address beneficiary
    ) external view returns (uint256) {
        return withdrawableAmount[streamId][beneficiary];
    }

    /**
     * @notice Get all streams for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return Array of stream IDs
     */
    function getBeneficiaryStreams(address beneficiary) external view returns (uint256[] memory) {
        return beneficiaryStreams[beneficiary];
    }

    /**
     * @notice Get stream details
     * @param streamId ID of the stream
     * @return Stream data
     */
    function getStream(
        uint256 streamId
    )
        external
        view
        returns (
            address domainNFT,
            uint256 tokenId,
            address[] memory beneficiaries,
            uint256[] memory shares,
            uint256 totalCollected,
            uint256 totalDistributed,
            bool active
        )
    {
        RevenueStream memory stream = streams[streamId];
        return (
            stream.domainNFT,
            stream.tokenId,
            stream.beneficiaries,
            stream.shares,
            stream.totalCollected,
            stream.totalDistributed,
            stream.active
        );
    }
}
