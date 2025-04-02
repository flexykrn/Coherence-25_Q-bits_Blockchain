const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Identity System", function () {
    let roleManager;
    let baseIdentity;
    let owner;
    let user;
    let verifier;
    let serviceProvider;

    beforeEach(async function () {
        // Get signers
        [owner, user, verifier, serviceProvider] = await ethers.getSigners();

        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        // Deploy BaseIdentity
        const BaseIdentity = await ethers.getContractFactory("BaseIdentity");
        baseIdentity = await BaseIdentity.deploy(await roleManager.getAddress());
        await baseIdentity.waitForDeployment();
    });

    describe("Role Management", function () {
        it("Should initialize with correct roles", async function () {
            // Check initial admin role
            expect(await roleManager.hasRole(await roleManager.ADMIN_ROLE(), owner.address)).to.be.true;
            
            // Check other roles are not assigned
            expect(await roleManager.hasRole(await roleManager.USER_ROLE(), owner.address)).to.be.false;
            expect(await roleManager.hasRole(await roleManager.VERIFIER_ROLE(), owner.address)).to.be.false;
            expect(await roleManager.hasRole(await roleManager.SERVICE_PROVIDER_ROLE(), owner.address)).to.be.false;
        });

        it("Should allow admin to grant roles", async function () {
            // Grant user role
            await roleManager.grantRole(await roleManager.USER_ROLE(), user.address);
            expect(await roleManager.hasRole(await roleManager.USER_ROLE(), user.address)).to.be.true;

            // Grant verifier role
            await roleManager.grantRole(await roleManager.VERIFIER_ROLE(), verifier.address);
            expect(await roleManager.hasRole(await roleManager.VERIFIER_ROLE(), verifier.address)).to.be.true;

            // Grant service provider role
            await roleManager.grantRole(await roleManager.SERVICE_PROVIDER_ROLE(), serviceProvider.address);
            expect(await roleManager.hasRole(await roleManager.SERVICE_PROVIDER_ROLE(), serviceProvider.address)).to.be.true;
        });

        it("Should allow admin to revoke roles", async function () {
            // Grant roles first
            await roleManager.grantRole(await roleManager.USER_ROLE(), user.address);
            await roleManager.grantRole(await roleManager.VERIFIER_ROLE(), verifier.address);

            // Revoke roles
            await roleManager.revokeRole(await roleManager.USER_ROLE(), user.address);
            await roleManager.revokeRole(await roleManager.VERIFIER_ROLE(), verifier.address);

            // Check roles are revoked
            expect(await roleManager.hasRole(await roleManager.USER_ROLE(), user.address)).to.be.false;
            expect(await roleManager.hasRole(await roleManager.VERIFIER_ROLE(), verifier.address)).to.be.false;
        });

        it("Should not allow non-admin to grant roles", async function () {
            await expect(
                roleManager.connect(user).grantRole(await roleManager.USER_ROLE(), verifier.address)
            ).to.be.revertedWithCustomError(roleManager, "AccessControlUnauthorizedAccount");
        });

        it("Should not allow non-admin to revoke roles", async function () {
            await roleManager.grantRole(await roleManager.USER_ROLE(), user.address);
            await expect(
                roleManager.connect(user).revokeRole(await roleManager.USER_ROLE(), verifier.address)
            ).to.be.revertedWithCustomError(roleManager, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Contract Pausing", function () {
        it("Should allow admin to pause contract", async function () {
            await roleManager.pause();
            expect(await roleManager.paused()).to.be.true;
        });

        it("Should allow admin to unpause contract", async function () {
            await roleManager.pause();
            await roleManager.unpause();
            expect(await roleManager.paused()).to.be.false;
        });

        it("Should not allow non-admin to pause contract", async function () {
            await expect(
                roleManager.connect(user).pause()
            ).to.be.revertedWithCustomError(roleManager, "AccessControlUnauthorizedAccount");
        });

        it("Should not allow non-admin to unpause contract", async function () {
            await roleManager.pause();
            await expect(
                roleManager.connect(user).unpause()
            ).to.be.revertedWithCustomError(roleManager, "AccessControlUnauthorizedAccount");
        });
    });

    describe("System Configuration", function () {
        it("Should allow admin to update system config", async function () {
            const config = {
                verificationFee: ethers.parseEther("0.1"),
                documentExpiryTime: 86400, // 1 day
                maxVerificationAttempts: 3,
                allowMultipleDIDs: true
            };

            await baseIdentity.updateSystemConfig(config);
            const savedConfig = await baseIdentity.config();
            
            expect(savedConfig.verificationFee).to.equal(config.verificationFee);
            expect(savedConfig.documentExpiryTime).to.equal(config.documentExpiryTime);
            expect(savedConfig.maxVerificationAttempts).to.equal(config.maxVerificationAttempts);
            expect(savedConfig.allowMultipleDIDs).to.equal(config.allowMultipleDIDs);
        });

        it("Should not allow non-admin to update system config", async function () {
            const config = {
                verificationFee: ethers.parseEther("0.1"),
                documentExpiryTime: 86400,
                maxVerificationAttempts: 3,
                allowMultipleDIDs: true
            };

            await expect(
                baseIdentity.connect(user).updateSystemConfig(config)
            ).to.be.revertedWithCustomError(baseIdentity, "AccessControlUnauthorizedAccount");
        });
    });
}); 