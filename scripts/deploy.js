const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("Starting deployment...");

    // Deploy BaseIdentity
    console.log("Deploying BaseIdentity...");
    const BaseIdentity = await hre.ethers.getContractFactory("BaseIdentity");
    const baseIdentity = await BaseIdentity.deploy();
    await baseIdentity.waitForDeployment();
    const baseIdentityAddress = await baseIdentity.getAddress();
    console.log("BaseIdentity deployed to:", baseIdentityAddress);

    // Deploy IPFSDocumentManager
    console.log("Deploying IPFSDocumentManager...");
    const IPFSDocumentManager = await hre.ethers.getContractFactory("IPFSDocumentManager");
    const ipfsDocumentManager = await IPFSDocumentManager.deploy();
    await ipfsDocumentManager.waitForDeployment();
    const ipfsDocumentManagerAddress = await ipfsDocumentManager.getAddress();
    console.log("IPFSDocumentManager deployed to:", ipfsDocumentManagerAddress);

    // Deploy IdentityRegistry
    console.log("Deploying IdentityRegistry...");
    const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
    const identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
    const identityRegistryAddress = await identityRegistry.getAddress();
    console.log("IdentityRegistry deployed to:", identityRegistryAddress);

    // Save contract addresses to .env file
    const fs = require('fs');
    const envContent = `
BASE_IDENTITY_ADDRESS=${baseIdentityAddress}
IPFS_DOCUMENT_MANAGER_ADDRESS=${ipfsDocumentManagerAddress}
IDENTITY_REGISTRY_ADDRESS=${identityRegistryAddress}
    `.trim();

    fs.writeFileSync('.env', envContent);
    console.log("Contract addresses saved to .env file");

    // Wait for block confirmations
    console.log("Waiting for block confirmations...");
    await Promise.all([
        baseIdentity.deploymentTransaction().wait(5),
        ipfsDocumentManager.deploymentTransaction().wait(5),
        identityRegistry.deploymentTransaction().wait(5)
    ]);

    // Verify contracts on Etherscan
    console.log("Verifying contracts on Etherscan...");
    try {
        await hre.run("verify:verify", {
            address: baseIdentityAddress,
            constructorArguments: [],
        });
        console.log("BaseIdentity verified");

        await hre.run("verify:verify", {
            address: ipfsDocumentManagerAddress,
            constructorArguments: [],
        });
        console.log("IPFSDocumentManager verified");

        await hre.run("verify:verify", {
            address: identityRegistryAddress,
            constructorArguments: [],
        });
        console.log("IdentityRegistry verified");
    } catch (error) {
        console.log("Error verifying contracts:", error);
    }

    console.log("Deployment completed successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 