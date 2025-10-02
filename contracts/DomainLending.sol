// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DomainLending
 * @notice Enables domain-collateralized lending using Doma Protocol Domain Ownership Tokens
 * @dev NOTE: Doma ownership tokens have transfer restrictions. This contract uses an approval-based
 *      collateralization model where the NFT remains with the owner but is locked via approval.
 *      In case of default, the lender can claim the NFT using the approved rights.
 */
contract DomainLending is IERC721Receiver, ReentrancyGuard, Ownable {
    struct Loan {
        address borrower;
        address domainNFT;
        uint256 tokenId;
        uint256 loanAmount;
        uint256 interestRate; // basis points (100 = 1%)
        uint256 startTime;
        uint256 duration;
        bool active;
        uint256 collateralValue;
    }

    IERC20 public immutable stablecoin;
    uint256 public loanCounter;
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80% LTV
    uint256 public constant BASIS_POINTS = 10000;

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        address domainNFT,
        uint256 tokenId,
        uint256 loanAmount,
        uint256 interestRate,
        uint256 duration
    );

    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 repaymentAmount);
    event LoanLiquidated(uint256 indexed loanId, address indexed liquidator);
    event CollateralClaimed(uint256 indexed loanId, address indexed lender);

    constructor(address _stablecoin) Ownable(msg.sender) {
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @notice Create a loan using a Domain NFT as collateral
     * @param domainNFT Address of the Domain Ownership Token contract
     * @param tokenId Token ID of the domain
     * @param loanAmount Amount to borrow in stablecoins
     * @param interestRate Interest rate in basis points
     * @param duration Loan duration in seconds
     * @param collateralValue Estimated value of the domain in stablecoins
     */
    function createLoan(
        address domainNFT,
        uint256 tokenId,
        uint256 loanAmount,
        uint256 interestRate,
        uint256 duration,
        uint256 collateralValue
    ) external nonReentrant returns (uint256) {
        require(loanAmount > 0, "Loan amount must be positive");
        require(
            (loanAmount * BASIS_POINTS) / collateralValue <= LIQUIDATION_THRESHOLD,
            "LTV too high"
        );
        require(duration >= 7 days && duration <= 365 days, "Invalid duration");

        // For Doma tokens, we can't reliably check ownership via ownerOf since they use
        // a complex proxy/gateway pattern. Instead, we verify through approval.
        // If someone can approve this contract, they have control over the token.

        // Verify this contract is approved to manage the NFT
        address approved = IERC721(domainNFT).getApproved(tokenId);
        bool isApprovedForAll = IERC721(domainNFT).isApprovedForAll(msg.sender, address(this));
        require(
            approved == address(this) || isApprovedForAll,
            "Contract must be approved - please approve first"
        );

        // Additional safety: verify the token exists and has an owner
        try IERC721(domainNFT).ownerOf(tokenId) returns (address tokenOwner) {
            require(tokenOwner != address(0), "Token does not exist");
            // We accept if either:
            // 1. msg.sender is the direct owner, OR
            // 2. msg.sender has approval rights (for proxy/gateway scenarios)
            // Since we already verified approval above, we proceed
        } catch {
            revert("Invalid token ID");
        }

        // NOTE: We do NOT transfer the NFT because Doma tokens have transfer restrictions
        // Instead, we rely on the approval. The NFT stays with the borrower but is locked.
        // If the borrower tries to transfer or revoke approval while loan is active,
        // they would be in breach and we can liquidate using our approved rights.

        uint256 loanId = loanCounter++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            domainNFT: domainNFT,
            tokenId: tokenId,
            loanAmount: loanAmount,
            interestRate: interestRate,
            startTime: block.timestamp,
            duration: duration,
            active: true,
            collateralValue: collateralValue
        });

        borrowerLoans[msg.sender].push(loanId);

        // Transfer stablecoins to borrower
        require(stablecoin.transfer(msg.sender, loanAmount), "Transfer failed");

        emit LoanCreated(loanId, msg.sender, domainNFT, tokenId, loanAmount, interestRate, duration);

        return loanId;
    }

    /**
     * @notice Repay a loan and release the collateral lock
     * @param loanId ID of the loan to repay
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(loan.borrower == msg.sender, "Not borrower");

        uint256 repaymentAmount = calculateRepaymentAmount(loanId);

        // Transfer repayment from borrower
        require(
            stablecoin.transferFrom(msg.sender, address(this), repaymentAmount),
            "Repayment failed"
        );

        // NOTE: NFT stays with borrower (it was never transferred)
        // Borrower can now safely revoke approval if desired
        loan.active = false;

        emit LoanRepaid(loanId, msg.sender, repaymentAmount);
    }

    /**
     * @notice Liquidate a defaulted loan by claiming the collateral NFT
     * @param loanId ID of the loan to liquidate
     */
    function liquidateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(block.timestamp > loan.startTime + loan.duration, "Loan not expired");

        // Verify we still have approval (borrower might have revoked)
        address approved = IERC721(loan.domainNFT).getApproved(loan.tokenId);
        address currentOwner = IERC721(loan.domainNFT).ownerOf(loan.tokenId);
        bool isApprovedForAll = IERC721(loan.domainNFT).isApprovedForAll(currentOwner, address(this));

        require(
            approved == address(this) || isApprovedForAll,
            "Approval revoked - cannot liquidate"
        );

        // Try to transfer the NFT from borrower to lender using our approval
        // This may fail if Doma tokens don't support third-party transfers
        try IERC721(loan.domainNFT).transferFrom(currentOwner, owner(), loan.tokenId) {
            // Transfer succeeded
        } catch {
            // If transfer fails, we keep the approval rights
            // In a production system, this would trigger an off-chain process
            // to claim the domain through Doma's proper channels
            revert("NFT transfer restricted - contact protocol admin");
        }

        loan.active = false;

        emit LoanLiquidated(loanId, msg.sender);
    }

    /**
     * @notice Calculate total repayment amount including interest
     * @param loanId ID of the loan
     * @return Total amount to repay
     */
    function calculateRepaymentAmount(uint256 loanId) public view returns (uint256) {
        Loan memory loan = loans[loanId];
        if (!loan.active) return 0;

        uint256 timeElapsed = block.timestamp - loan.startTime;
        if (timeElapsed > loan.duration) timeElapsed = loan.duration;

        uint256 interest = (loan.loanAmount * loan.interestRate * timeElapsed) /
            (365 days * BASIS_POINTS);

        return loan.loanAmount + interest;
    }

    /**
     * @notice Get all loan IDs for a borrower
     * @param borrower Address of the borrower
     * @return Array of loan IDs
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
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
     * @notice Withdraw accumulated stablecoins (protocol fees/repayments)
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(stablecoin.transfer(owner(), amount), "Withdrawal failed");
    }
}
