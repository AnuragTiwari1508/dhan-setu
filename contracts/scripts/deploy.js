const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DhanSetu contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy DhanSetuToken (example token)
  console.log("\nDeploying DhanSetuToken...");
  const DhanSetuToken = await ethers.getContractFactory("DhanSetuToken");
  const token = await DhanSetuToken.deploy(
    "DhanSetu Token",
    "DHST",
    18,
    1000000, // 1M tokens
    deployer.address
  );
  await token.waitForDeployment();
  console.log("DhanSetuToken deployed to:", await token.getAddress());

  // Deploy DhanSetuPayment
  console.log("\nDeploying DhanSetuPayment...");
  const DhanSetuPayment = await ethers.getContractFactory("DhanSetuPayment");
  const payment = await DhanSetuPayment.deploy(deployer.address); // Fee recipient
  await payment.waitForDeployment();
  console.log("DhanSetuPayment deployed to:", await payment.getAddress());

  // Deploy DhanSetuSubscription
  console.log("\nDeploying DhanSetuSubscription...");
  const DhanSetuSubscription = await ethers.getContractFactory("DhanSetuSubscription");
  const subscription = await DhanSetuSubscription.deploy(deployer.address); // Fee recipient
  await subscription.waitForDeployment();
  console.log("DhanSetuSubscription deployed to:", await subscription.getAddress());

  // Save deployment addresses
  const deployments = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      DhanSetuToken: await token.getAddress(),
      DhanSetuPayment: await payment.getAddress(),
      DhanSetuSubscription: await subscription.getAddress()
    },
    deploymentTime: new Date().toISOString()
  };

  const fs = require("fs");
  const path = require("path");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info
  const networkName = (await ethers.provider.getNetwork()).name || "unknown";
  fs.writeFileSync(
    path.join(deploymentsDir, `${networkName}.json`),
    JSON.stringify(deployments, null, 2)
  );

  console.log("\n✅ Deployment completed!");
  console.log("📄 Deployment details saved to:", `deployments/${networkName}.json`);
  
  // Verify contracts on Etherscan (if not local network)
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await token.deploymentTransaction().wait(5);
    await payment.deploymentTransaction().wait(5);
    await subscription.deploymentTransaction().wait(5);
    
    console.log("🔍 Verifying contracts on Etherscan...");
    try {
      await run("verify:verify", {
        address: await token.getAddress(),
        constructorArguments: ["DhanSetu Token", "DHST", 18, 1000000, deployer.address]
      });
      
      await run("verify:verify", {
        address: await payment.getAddress(),
        constructorArguments: [deployer.address]
      });
      
      await run("verify:verify", {
        address: await subscription.getAddress(),
        constructorArguments: [deployer.address]
      });
      
      console.log("✅ Contracts verified on Etherscan!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
