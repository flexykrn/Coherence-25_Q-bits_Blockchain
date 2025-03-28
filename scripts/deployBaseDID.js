const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying BaseDID with the account:", deployer.address);

  // Deploy BaseDID
  const BaseDID = await hre.ethers.getContractFactory("BaseDID");
  const baseDID = await BaseDID.deploy();
  await baseDID.waitForDeployment();
  const baseDIDAddress = await baseDID.getAddress();
  console.log("BaseDID deployed to:", baseDIDAddress);

  // Wait for a few block confirmations
  await baseDID.deploymentTransaction().wait(5);

  // Verify BaseDID on Etherscan
  try {
    await hre.run("verify:verify", {
      address: baseDIDAddress,
      constructorArguments: [],
    });
    console.log("BaseDID verified on Etherscan");
  } catch (error) {
    console.error("Error verifying BaseDID:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 