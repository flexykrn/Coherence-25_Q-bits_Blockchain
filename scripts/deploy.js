const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy BaseDID
  const BaseDID = await hre.ethers.getContractFactory("BaseDID");
  const baseDID = await BaseDID.deploy();
  await baseDID.waitForDeployment();
  console.log("BaseDID deployed to:", await baseDID.getAddress());

  // Deploy AadharDID
  const AadharDID = await hre.ethers.getContractFactory("AadharDID");
  const aadharDID = await AadharDID.deploy();
  await aadharDID.waitForDeployment();
  console.log("AadharDID deployed to:", await aadharDID.getAddress());

  // Deploy PANDID
  const PANDID = await hre.ethers.getContractFactory("PANDID");
  const panDID = await PANDID.deploy();
  await panDID.waitForDeployment();
  console.log("PANDID deployed to:", await panDID.getAddress());

  // Deploy DriversLicenseDID
  const DriversLicenseDID = await hre.ethers.getContractFactory("DriversLicenseDID");
  const driversLicenseDID = await DriversLicenseDID.deploy();
  await driversLicenseDID.waitForDeployment();
  console.log("DriversLicenseDID deployed to:", await driversLicenseDID.getAddress());

  // Wait for a few block confirmations
  await baseDID.deploymentTransaction().wait(5);
  await aadharDID.deploymentTransaction().wait(5);
  await panDID.deploymentTransaction().wait(5);
  await driversLicenseDID.deploymentTransaction().wait(5);

  // Verify contracts on Etherscan
  try {
    await hre.run("verify:verify", {
      address: await baseDID.getAddress(),
      constructorArguments: [],
    });
    console.log("BaseDID verified on Etherscan");
  } catch (error) {
    console.error("Error verifying BaseDID:", error);
  }

  try {
    await hre.run("verify:verify", {
      address: await aadharDID.getAddress(),
      constructorArguments: [],
    });
    console.log("AadharDID verified on Etherscan");
  } catch (error) {
    console.error("Error verifying AadharDID:", error);
  }

  try {
    await hre.run("verify:verify", {
      address: await panDID.getAddress(),
      constructorArguments: [],
    });
    console.log("PANDID verified on Etherscan");
  } catch (error) {
    console.error("Error verifying PANDID:", error);
  }

  try {
    await hre.run("verify:verify", {
      address: await driversLicenseDID.getAddress(),
      constructorArguments: [],
    });
    console.log("DriversLicenseDID verified on Etherscan");
  } catch (error) {
    console.error("Error verifying DriversLicenseDID:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });