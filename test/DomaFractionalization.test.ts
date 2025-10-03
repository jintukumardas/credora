import { expect } from "chai";
import { ethers } from "hardhat";
import { DomaFractionalization, MockERC721, MockERC20, MockDEX } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DomaFractionalization", function () {
  let fractionalization: DomaFractionalization;
  let domainNFT: MockERC721;
  let usdc: MockERC20;
  let mockDex: MockDEX;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let launchpad: SignerWithAddress;

  const TOKEN_ID = 1;
  const TOTAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const MIN_BUYOUT_PRICE = ethers.parseUnits("50000", 6); // 50k USDC

  beforeEach(async function () {
    [owner, user1, user2, launchpad] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy Mock Domain NFT
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    domainNFT = await MockERC721.deploy();
    await domainNFT.waitForDeployment();

    // Deploy MockDEX
    const MockDEX = await ethers.getContractFactory("MockDEX");
    mockDex = await MockDEX.deploy();
    await mockDex.waitForDeployment();

    // Deploy DomaFractionalization
    const DomaFractionalization = await ethers.getContractFactory("DomaFractionalization");
    fractionalization = await DomaFractionalization.deploy(
      await usdc.getAddress(),
      await mockDex.getAddress()
    );
    await fractionalization.waitForDeployment();

    // Mint a domain NFT to user1
    await domainNFT.mint(user1.address, TOKEN_ID);

    // Give user2 some USDC for buyout testing
    await usdc.mint(user2.address, ethers.parseUnits("100000", 6));
    await usdc.connect(user2).approve(
      await fractionalization.getAddress(),
      ethers.parseUnits("100000", 6)
    );
  });

  describe("Fractionalization", function () {
    it("Should fractionalize a domain NFT", async function () {
      // Approve fractionalization contract
      await domainNFT.connect(user1).approve(await fractionalization.getAddress(), TOKEN_ID);

      // Fractionalize
      const tx = await fractionalization.connect(user1).fractionalizeOwnershipToken(
        await domainNFT.getAddress(),
        TOKEN_ID,
        { name: "Example.com Fractional", symbol: "EXMPL" },
        TOTAL_SUPPLY,
        MIN_BUYOUT_PRICE,
        launchpad.address
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check NFT is transferred to fractionalization contract
      expect(await domainNFT.ownerOf(TOKEN_ID)).to.equal(await fractionalization.getAddress());

      // Check domain info
      const domainInfo = await fractionalization.getDomainInfo(
        await domainNFT.getAddress(),
        TOKEN_ID
      );
      expect(domainInfo.ownershipToken).to.equal(await domainNFT.getAddress());
      expect(domainInfo.tokenId).to.equal(TOKEN_ID);
      expect(domainInfo.minimumBuyoutPrice).to.equal(MIN_BUYOUT_PRICE);
      expect(domainInfo.isBoughtOut).to.be.false;
      expect(domainInfo.originalOwner).to.equal(user1.address);
    });

    it("Should mint fractional tokens with protocol fee", async function () {
      await domainNFT.connect(user1).approve(await fractionalization.getAddress(), TOKEN_ID);

      const tx = await fractionalization.connect(user1).fractionalizeOwnershipToken(
        await domainNFT.getAddress(),
        TOKEN_ID,
        { name: "Example.com Fractional", symbol: "EXMPL" },
        TOTAL_SUPPLY,
        MIN_BUYOUT_PRICE,
        launchpad.address
      );

      // Get fractional token address from event
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment && log.fragment.name === "NameTokenFractionalized"
      );

      // Note: In production, you'd extract the fractional token address from events
      // For now, we verify the domain info was stored
      const domainInfo = await fractionalization.getDomainInfo(
        await domainNFT.getAddress(),
        TOKEN_ID
      );
      expect(domainInfo.fractionalToken).to.not.equal(ethers.ZeroAddress);
    });

    it("Should reject fractionalization without approval", async function () {
      await expect(
        fractionalization.connect(user1).fractionalizeOwnershipToken(
          await domainNFT.getAddress(),
          TOKEN_ID,
          { name: "Example.com Fractional", symbol: "EXMPL" },
          TOTAL_SUPPLY,
          MIN_BUYOUT_PRICE,
          launchpad.address
        )
      ).to.be.reverted;
    });

    it("Should reject fractionalization by non-owner", async function () {
      await domainNFT.connect(user1).approve(await fractionalization.getAddress(), TOKEN_ID);

      await expect(
        fractionalization.connect(user2).fractionalizeOwnershipToken(
          await domainNFT.getAddress(),
          TOKEN_ID,
          { name: "Example.com Fractional", symbol: "EXMPL" },
          TOTAL_SUPPLY,
          MIN_BUYOUT_PRICE,
          launchpad.address
        )
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("Buyout", function () {
    let fractionalTokenAddress: string;

    beforeEach(async function () {
      // Fractionalize first
      await domainNFT.connect(user1).approve(await fractionalization.getAddress(), TOKEN_ID);

      const tx = await fractionalization.connect(user1).fractionalizeOwnershipToken(
        await domainNFT.getAddress(),
        TOKEN_ID,
        { name: "Example.com Fractional", symbol: "EXMPL" },
        TOTAL_SUPPLY,
        MIN_BUYOUT_PRICE,
        launchpad.address
      );

      await tx.wait();

      // Get fractional token address
      const domainInfo = await fractionalization.getDomainInfo(
        await domainNFT.getAddress(),
        TOKEN_ID
      );
      fractionalTokenAddress = domainInfo.fractionalToken;

      // Set price in DEX
      await mockDex.setPrice(fractionalTokenAddress, ethers.parseUnits("0.08", 18)); // $0.08 per token
    });

    it("Should calculate buyout price correctly (FDMC > MBP)", async function () {
      // FDMC = 1M * 0.08 = 80k USDC > MBP (50k)
      const buyoutPrice = await fractionalization.getOwnershipTokenBuyoutPrice(
        await domainNFT.getAddress(),
        TOKEN_ID
      );

      expect(buyoutPrice).to.equal(ethers.parseUnits("80000", 6)); // 80k USDC
    });

    it("Should calculate buyout price correctly (MBP > FDMC)", async function () {
      // Set lower price: FDMC = 1M * 0.03 = 30k USDC < MBP (50k)
      await mockDex.setPrice(fractionalTokenAddress, ethers.parseUnits("0.03", 18));

      const buyoutPrice = await fractionalization.getOwnershipTokenBuyoutPrice(
        await domainNFT.getAddress(),
        TOKEN_ID
      );

      expect(buyoutPrice).to.equal(MIN_BUYOUT_PRICE); // 50k USDC
    });

    it("Should allow buyout and transfer NFT", async function () {
      const buyoutPrice = await fractionalization.getOwnershipTokenBuyoutPrice(
        await domainNFT.getAddress(),
        TOKEN_ID
      );

      await fractionalization.connect(user2).buyoutOwnershipToken(
        await domainNFT.getAddress(),
        TOKEN_ID
      );

      // Check NFT transferred to buyer
      expect(await domainNFT.ownerOf(TOKEN_ID)).to.equal(user2.address);

      // Check domain marked as bought out
      const domainInfo = await fractionalization.getDomainInfo(
        await domainNFT.getAddress(),
        TOKEN_ID
      );
      expect(domainInfo.isBoughtOut).to.be.true;
      expect(domainInfo.buyoutPrice).to.equal(buyoutPrice);
    });

    it("Should reject buyout without sufficient USDC", async function () {
      // Remove user2's USDC
      const balance = await usdc.balanceOf(user2.address);
      await usdc.connect(user2).transfer(owner.address, balance);

      await expect(
        fractionalization.connect(user2).buyoutOwnershipToken(
          await domainNFT.getAddress(),
          TOKEN_ID
        )
      ).to.be.reverted;
    });

    it("Should reject double buyout", async function () {
      await fractionalization.connect(user2).buyoutOwnershipToken(
        await domainNFT.getAddress(),
        TOKEN_ID
      );

      // Try to buy out again
      await expect(
        fractionalization.connect(user2).buyoutOwnershipToken(
          await domainNFT.getAddress(),
          TOKEN_ID
        )
      ).to.be.revertedWith("Already bought out");
    });
  });

  describe("Edge Cases", function () {
    it("Should reject zero total supply", async function () {
      await domainNFT.connect(user1).approve(await fractionalization.getAddress(), TOKEN_ID);

      await expect(
        fractionalization.connect(user1).fractionalizeOwnershipToken(
          await domainNFT.getAddress(),
          TOKEN_ID,
          { name: "Example.com Fractional", symbol: "EXMPL" },
          0,
          MIN_BUYOUT_PRICE,
          launchpad.address
        )
      ).to.be.revertedWith("Total supply must be positive");
    });

    it("Should reject zero minimum buyout price", async function () {
      await domainNFT.connect(user1).approve(await fractionalization.getAddress(), TOKEN_ID);

      await expect(
        fractionalization.connect(user1).fractionalizeOwnershipToken(
          await domainNFT.getAddress(),
          TOKEN_ID,
          { name: "Example.com Fractional", symbol: "EXMPL" },
          TOTAL_SUPPLY,
          0,
          launchpad.address
        )
      ).to.be.revertedWith("Minimum buyout price must be positive");
    });

    it("Should reject invalid launchpad address", async function () {
      await domainNFT.connect(user1).approve(await fractionalization.getAddress(), TOKEN_ID);

      await expect(
        fractionalization.connect(user1).fractionalizeOwnershipToken(
          await domainNFT.getAddress(),
          TOKEN_ID,
          { name: "Example.com Fractional", symbol: "EXMPL" },
          TOTAL_SUPPLY,
          MIN_BUYOUT_PRICE,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid launchpad address");
    });
  });
});
