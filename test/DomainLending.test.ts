import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { DomainLending, MockERC20, MockERC721 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DomainLending", function () {
  // Fixture for deployment
  async function deployLendingFixture() {
    const [owner, borrower, lender] = await ethers.getSigners();

    // Deploy MockERC20 (USDC)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy MockERC721 (Domain NFT)
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const domainNFT = await MockERC721.deploy("Domain NFT", "DOMAIN");
    await domainNFT.waitForDeployment();

    // Deploy DomainLending
    const DomainLending = await ethers.getContractFactory("DomainLending");
    const lending = await DomainLending.deploy(await usdc.getAddress());
    await lending.waitForDeployment();

    // Mint test tokens
    const tokenId = 1n;
    await domainNFT.mint(borrower.address, tokenId);

    // Mint USDC to lending contract (simulate liquidity)
    const initialLiquidity = ethers.parseUnits("100000", 6); // 100k USDC
    await usdc.mint(await lending.getAddress(), initialLiquidity);

    return {
      lending,
      usdc,
      domainNFT,
      owner,
      borrower,
      lender,
      tokenId,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct stablecoin address", async function () {
      const { lending, usdc } = await loadFixture(deployLendingFixture);
      expect(await lending.stablecoin()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct owner", async function () {
      const { lending, owner } = await loadFixture(deployLendingFixture);
      expect(await lending.owner()).to.equal(owner.address);
    });

    it("Should start with loan counter at 0", async function () {
      const { lending } = await loadFixture(deployLendingFixture);
      expect(await lending.loanCounter()).to.equal(0);
    });
  });

  describe("Create Loan", function () {
    it("Should create a loan successfully", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      const loanAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      const collateralValue = ethers.parseUnits("2000", 6); // 2000 USDC
      const interestRate = 850n; // 8.5% APR in basis points
      const duration = 30n * 24n * 60n * 60n; // 30 days

      // Approve NFT
      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);

      // Create loan
      await expect(
        lending
          .connect(borrower)
          .createLoan(
            await domainNFT.getAddress(),
            tokenId,
            loanAmount,
            interestRate,
            duration,
            collateralValue
          )
      )
        .to.emit(lending, "LoanCreated")
        .withArgs(
          0,
          borrower.address,
          await domainNFT.getAddress(),
          tokenId,
          loanAmount,
          interestRate,
          duration
        );

      // Check loan details
      const loan = await lending.loans(0);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.domainNFT).to.equal(await domainNFT.getAddress());
      expect(loan.tokenId).to.equal(tokenId);
      expect(loan.loanAmount).to.equal(loanAmount);
      expect(loan.interestRate).to.equal(interestRate);
      expect(loan.duration).to.equal(duration);
      expect(loan.active).to.equal(true);
      expect(loan.collateralValue).to.equal(collateralValue);

      // Check NFT was transferred
      expect(await domainNFT.ownerOf(tokenId)).to.equal(
        await lending.getAddress()
      );
    });

    it("Should fail if loan amount is 0", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);

      await expect(
        lending
          .connect(borrower)
          .createLoan(
            await domainNFT.getAddress(),
            tokenId,
            0,
            850n,
            30n * 24n * 60n * 60n,
            ethers.parseUnits("2000", 6)
          )
      ).to.be.revertedWith("Loan amount must be positive");
    });

    it("Should fail if LTV is too high", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      const loanAmount = ethers.parseUnits("900", 6); // 900 USDC
      const collateralValue = ethers.parseUnits("1000", 6); // 1000 USDC (90% LTV)

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);

      await expect(
        lending
          .connect(borrower)
          .createLoan(
            await domainNFT.getAddress(),
            tokenId,
            loanAmount,
            850n,
            30n * 24n * 60n * 60n,
            collateralValue
          )
      ).to.be.revertedWith("LTV too high");
    });

    it("Should fail if duration is too short", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);

      await expect(
        lending
          .connect(borrower)
          .createLoan(
            await domainNFT.getAddress(),
            tokenId,
            ethers.parseUnits("1000", 6),
            850n,
            5n * 24n * 60n * 60n, // 5 days
            ethers.parseUnits("2000", 6)
          )
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should fail if duration is too long", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);

      await expect(
        lending
          .connect(borrower)
          .createLoan(
            await domainNFT.getAddress(),
            tokenId,
            ethers.parseUnits("1000", 6),
            850n,
            400n * 24n * 60n * 60n, // 400 days
            ethers.parseUnits("2000", 6)
          )
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Repay Loan", function () {
    it("Should repay loan successfully", async function () {
      const { lending, usdc, domainNFT, borrower, tokenId } =
        await loadFixture(deployLendingFixture);

      const loanAmount = ethers.parseUnits("1000", 6);
      const collateralValue = ethers.parseUnits("2000", 6);
      const interestRate = 850n;
      const duration = 30n * 24n * 60n * 60n;

      // Create loan
      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);
      await lending
        .connect(borrower)
        .createLoan(
          await domainNFT.getAddress(),
          tokenId,
          loanAmount,
          interestRate,
          duration,
          collateralValue
        );

      // Fast forward some time to accrue interest
      await time.increase(1n * 24n * 60n * 60n); // 1 day

      // Calculate repayment amount after time passed
      const repaymentAmount = await lending.calculateRepaymentAmount(0);

      // Mint USDC to borrower for repayment (add buffer for precision)
      const repaymentWithBuffer = repaymentAmount + ethers.parseUnits("10", 6);
      await usdc.mint(borrower.address, repaymentWithBuffer);

      // Approve repayment
      await usdc
        .connect(borrower)
        .approve(await lending.getAddress(), repaymentWithBuffer);

      // Repay loan
      const tx = await lending.connect(borrower).repayLoan(0);
      await expect(tx).to.emit(lending, "LoanRepaid");

      // Check loan is inactive
      const loan = await lending.loans(0);
      expect(loan.active).to.equal(false);

      // Check NFT was returned
      expect(await domainNFT.ownerOf(tokenId)).to.equal(borrower.address);
    });

    it("Should calculate interest correctly", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      const loanAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      const interestRate = 1000n; // 10% APR
      const duration = 365n * 24n * 60n * 60n; // 1 year

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);
      await lending
        .connect(borrower)
        .createLoan(
          await domainNFT.getAddress(),
          tokenId,
          loanAmount,
          interestRate,
          duration,
          ethers.parseUnits("2000", 6)
        );

      // Fast forward 1 year
      await time.increase(duration);

      const repaymentAmount = await lending.calculateRepaymentAmount(0);
      const expectedInterest = ethers.parseUnits("100", 6); // 10% of 1000
      const expectedTotal = loanAmount + expectedInterest;

      expect(repaymentAmount).to.equal(expectedTotal);
    });

    it("Should fail to repay if not borrower", async function () {
      const { lending, domainNFT, borrower, lender, tokenId } =
        await loadFixture(deployLendingFixture);

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);
      await lending
        .connect(borrower)
        .createLoan(
          await domainNFT.getAddress(),
          tokenId,
          ethers.parseUnits("1000", 6),
          850n,
          30n * 24n * 60n * 60n,
          ethers.parseUnits("2000", 6)
        );

      await expect(lending.connect(lender).repayLoan(0)).to.be.revertedWith(
        "Not borrower"
      );
    });
  });

  describe("Liquidate Loan", function () {
    it("Should liquidate expired loan", async function () {
      const { lending, domainNFT, borrower, owner, tokenId } =
        await loadFixture(deployLendingFixture);

      const duration = 30n * 24n * 60n * 60n;

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);
      await lending
        .connect(borrower)
        .createLoan(
          await domainNFT.getAddress(),
          tokenId,
          ethers.parseUnits("1000", 6),
          850n,
          duration,
          ethers.parseUnits("2000", 6)
        );

      // Fast forward past duration
      await time.increase(duration + 1n);

      // Liquidate
      await expect(lending.liquidateLoan(0))
        .to.emit(lending, "LoanLiquidated")
        .withArgs(0, owner.address);

      // Check NFT went to owner
      expect(await domainNFT.ownerOf(tokenId)).to.equal(owner.address);

      // Check loan is inactive
      const loan = await lending.loans(0);
      expect(loan.active).to.equal(false);
    });

    it("Should fail to liquidate if not expired", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);
      await lending
        .connect(borrower)
        .createLoan(
          await domainNFT.getAddress(),
          tokenId,
          ethers.parseUnits("1000", 6),
          850n,
          30n * 24n * 60n * 60n,
          ethers.parseUnits("2000", 6)
        );

      await expect(lending.liquidateLoan(0)).to.be.revertedWith(
        "Loan not expired"
      );
    });
  });

  describe("View Functions", function () {
    it("Should get borrower loans", async function () {
      const { lending, domainNFT, borrower, tokenId } = await loadFixture(
        deployLendingFixture
      );

      // Mint another NFT
      await domainNFT.mint(borrower.address, 2n);

      // Create two loans
      await domainNFT
        .connect(borrower)
        .approve(await lending.getAddress(), tokenId);
      await lending
        .connect(borrower)
        .createLoan(
          await domainNFT.getAddress(),
          tokenId,
          ethers.parseUnits("1000", 6),
          850n,
          30n * 24n * 60n * 60n,
          ethers.parseUnits("2000", 6)
        );

      await domainNFT.connect(borrower).approve(await lending.getAddress(), 2n);
      await lending
        .connect(borrower)
        .createLoan(
          await domainNFT.getAddress(),
          2n,
          ethers.parseUnits("500", 6),
          850n,
          30n * 24n * 60n * 60n,
          ethers.parseUnits("1000", 6)
        );

      const loans = await lending.getBorrowerLoans(borrower.address);
      expect(loans.length).to.equal(2);
      expect(loans[0]).to.equal(0);
      expect(loans[1]).to.equal(1);
    });
  });
});
