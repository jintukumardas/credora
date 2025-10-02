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
 * @dev Accepts Domain NFTs as collateral and issues loans in stablecoins
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

        // Transfer domain NFT to this contract
        IERC721(domainNFT).safeTransferFrom(msg.sender, address(this), tokenId);

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
     * @notice Repay a loan and reclaim the domain NFT
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

        // Return domain NFT to borrower
        IERC721(loan.domainNFT).safeTransferFrom(address(this), msg.sender, loan.tokenId);

        loan.active = false;

        emit LoanRepaid(loanId, msg.sender, repaymentAmount);
    }

    /**
     * @notice Liquidate a defaulted loan
     * @param loanId ID of the loan to liquidate
     */
    function liquidateLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(block.timestamp > loan.startTime + loan.duration, "Loan not expired");

        // Transfer domain NFT to contract owner/lender
        IERC721(loan.domainNFT).safeTransferFrom(address(this), owner(), loan.tokenId);

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
