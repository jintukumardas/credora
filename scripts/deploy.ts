import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Credora contracts...");

  // Deploy mock USDC for testing (replace with actual USDC address on mainnet)
  console.log("\n1. Deploying mock USDC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // Deploy DomainLending
  console.log("\n2. Deploying DomainLending...");
  const DomainLending = await ethers.getContractFactory("DomainLending");
  const lending = await DomainLending.deploy(usdcAddress);
  await lending.waitForDeployment();
  const lendingAddress = await lending.getAddress();
  console.log("DomainLending deployed to:", lendingAddress);

  // Deploy DomainLeasing
  console.log("\n3. Deploying DomainLeasing...");
  const DomainLeasing = await ethers.getContractFactory("DomainLeasing");
  const leasing = await DomainLeasing.deploy(usdcAddress);
  await leasing.waitForDeployment();
  const leasingAddress = await leasing.getAddress();
  console.log("DomainLeasing deployed to:", leasingAddress);

  // Deploy RevenueDistributor
  console.log("\n4. Deploying RevenueDistributor...");
  const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
  const revenue = await RevenueDistributor.deploy(usdcAddress);
  await revenue.waitForDeployment();
  const revenueAddress = await revenue.getAddress();
  console.log("RevenueDistributor deployed to:", revenueAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("USDC (Mock):", usdcAddress);
  console.log("DomainLending:", lendingAddress);
  console.log("DomainLeasing:", leasingAddress);
  console.log("RevenueDistributor:", revenueAddress);

  console.log("\n=== Update .env with these addresses ===");
  console.log(`NEXT_PUBLIC_LENDING_CONTRACT=${lendingAddress}`);
  console.log(`NEXT_PUBLIC_LEASING_CONTRACT=${leasingAddress}`);
  console.log(`NEXT_PUBLIC_REVENUE_CONTRACT=${revenueAddress}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
