import { ethers } from "hardhat";

async function main() {
  console.log("Funding DomainLending contract with USDC...");

  // Contract addresses from deployment
  const USDC_ADDRESS = "0xeafB8d6cF908e8801F46c8d4209452E836d2dba0";
  const LENDING_ADDRESS = "0xa1C18d3e172cBa727489BD9d51531BB06318a433";

  // Amount to mint: 1,000,000 USDC (6 decimals)
  const AMOUNT = ethers.parseUnits("1000000", 6);

  // Get the MockERC20 contract
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(USDC_ADDRESS);

  console.log("Minting", ethers.formatUnits(AMOUNT, 6), "USDC to lending contract...");

  const tx = await usdc.mint(LENDING_ADDRESS, AMOUNT);
  await tx.wait();

  console.log("✅ Successfully funded lending contract!");
  console.log("Transaction hash:", tx.hash);

  // Check balance
  const balance = await usdc.balanceOf(LENDING_ADDRESS);
  console.log("Lending contract USDC balance:", ethers.formatUnits(balance, 6), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
