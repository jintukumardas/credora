import hre from "hardhat";
// @ts-ignore
const ethers = hre.ethers;

async function main() {
  console.log("Deploying Doma Fractionalization contracts...");

  // Use existing USDC address from .env or deploy mock
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0xeafB8d6cF908e8801F46c8d4209452E836d2dba0";
  console.log("Using USDC address:", usdcAddress);

  // Deploy MockDEX (Price Oracle)
  console.log("\n1. Deploying MockDEX (Price Oracle)...");
  const MockDEX = await ethers.getContractFactory("MockDEX");
  const mockDex = await MockDEX.deploy();
  await mockDex.waitForDeployment();
  const mockDexAddress = await mockDex.getAddress();
  console.log("MockDEX deployed to:", mockDexAddress);

  // Deploy DomaFractionalization
  console.log("\n2. Deploying DomaFractionalization...");
  const DomaFractionalization = await ethers.getContractFactory("DomaFractionalization");
  const fractionalization = await DomaFractionalization.deploy(usdcAddress, mockDexAddress);
  await fractionalization.waitForDeployment();
  const fractionalAddress = await fractionalization.getAddress();
  console.log("DomaFractionalization deployed to:", fractionalAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("USDC:", usdcAddress);
  console.log("MockDEX (Price Oracle):", mockDexAddress);
  console.log("DomaFractionalization:", fractionalAddress);

  console.log("\n=== Update .env with these addresses ===");
  console.log(`NEXT_PUBLIC_DOMA_FRACTIONALIZATION=${fractionalAddress}`);
  console.log(`NEXT_PUBLIC_PRICE_ORACLE=${mockDexAddress}`);

  // Optional: Set up some initial prices for testing
  console.log("\n=== Setting up test prices ===");
  // Example: Set price for a hypothetical fractional token
  // await mockDex.setPrice(fractionalTokenAddress, ethers.parseUnits("1000", 18));
  console.log("Note: Use MockDEX.setPrice() to configure token prices for testing");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
