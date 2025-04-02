const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Identity System", function () {
  let RoleManager, roleManager, BaseIdentity, baseIdentity, IdentityRegistry, identityRegistry, IPFSDocumentManager, ipfsDocumentManager;
  let owner, verifier1, verifier2, user1, user2, serviceProvider;
  let ADMIN_ROLE, VERIFIER_ROLE, USER_ROLE;

  beforeEach(async function () {
    // Get signers
    [owner, verifier1, verifier2, user1, user2, serviceProvider] = await ethers.getSigners();

    // Deploy RoleManager
    RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.deployed();

    // Deploy BaseIdentity
    BaseIdentity = await ethers.getContractFactory("BaseIdentity");
    baseIdentity = await BaseIdentity.deploy(roleManager.address);
    await baseIdentity.deployed();

    // Deploy IdentityRegistry
    IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy(roleManager.address);
    await identityRegistry.deployed();

    // Deploy IPFSDocumentManager
    IPFSDocumentManager = await ethers.getContractFactory("IPFSDocumentManager");
    ipfsDocumentManager = await IPFSDocumentManager.deploy(roleManager.address);
    await ipfsDocumentManager.deployed();

    // Get role constants
    ADMIN_ROLE = await roleManager.ADMIN_ROLE();
    VERIFIER_ROLE = await roleManager.VERIFIER_ROLE();
    USER_ROLE = await roleManager.USER_ROLE();
  });

  describe("Role Management", function () {
    it("Should set deployer as admin", async function () {
      expect(await roleManager.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should allow admin to register verifiers", async function () {
      await roleManager.registerVerifier(
        verifier1.address,
        "Test Verifier 1",
        "Test Organization"
      );
      expect(await roleManager.hasRole(VERIFIER_ROLE, verifier1.address)).to.be.true;
    });

    it("Should not allow non-admin to register verifiers", async function () {
      await expect(
        roleManager.connect(verifier1).registerVerifier(
          verifier2.address,
          "Test Verifier 2",
          "Test Organization"
        )
      ).to.be.revertedWith("Caller is not an admin");
    });

    it("Should allow verifiers to register users", async function () {
      await roleManager.registerVerifier(
        verifier1.address,
        "Test Verifier 1",
        "Test Organization"
      );
      await roleManager.connect(verifier1).registerUser(user1.address);
      expect(await roleManager.hasRole(USER_ROLE, user1.address)).to.be.true;
    });

    it("Should not allow non-verifiers to register users", async function () {
      await expect(
        roleManager.connect(user1).registerUser(user2.address)
      ).to.be.revertedWith("Caller is not a verifier");
    });
  });

  describe("ZKP Verification", function () {
    beforeEach(async function () {
      // Set up roles
      await roleManager.registerVerifier(
        verifier1.address,
        "Test Verifier 1",
        "Test Organization"
      );
      await roleManager.connect(verifier1).registerUser(user1.address);
    });

    it("Should allow verifiers to verify ZKPs", async function () {
      const proofHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test proof"));
      const messageHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "bytes32"],
          [user1.address, proofHash]
        )
      );
      const signature = await user1.signMessage(ethers.utils.arrayify(messageHash));

      await roleManager.connect(verifier1).verifyZKP(
        user1.address,
        proofHash,
        signature
      );

      const [totalVerifications, successRate] = await roleManager.getVerifierStats(verifier1.address);
      expect(totalVerifications).to.equal(1);
      expect(successRate).to.equal(100);
    });

    it("Should not allow non-verifiers to verify ZKPs", async function () {
      const proofHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test proof"));
      const messageHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "bytes32"],
          [user1.address, proofHash]
        )
      );
      const signature = await user1.signMessage(ethers.utils.arrayify(messageHash));

      await expect(
        roleManager.connect(user1).verifyZKP(
          user1.address,
          proofHash,
          signature
        )
      ).to.be.revertedWith("Caller is not a verifier");
    });
  });

  describe("Document Management", function () {
    beforeEach(async function () {
      // Set up roles
      await roleManager.registerVerifier(
        verifier1.address,
        "Test Verifier 1",
        "Test Organization"
      );
      await roleManager.connect(verifier1).registerUser(user1.address);
    });

    it("Should allow users to upload documents", async function () {
      const ipfsHash = "QmTest1";
      const documentType = "AADHAAR";
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await ipfsDocumentManager.connect(user1).uploadDocument(
        ipfsHash,
        documentType,
        expiryTimestamp
      );

      const [docType, uploadTime, expiry, isActive, uploadedBy] = await ipfsDocumentManager.getDocument(ipfsHash);
      expect(docType).to.equal(documentType);
      expect(isActive).to.be.true;
      expect(uploadedBy).to.equal(user1.address);
    });

    it("Should not allow non-users to upload documents", async function () {
      const ipfsHash = "QmTest1";
      const documentType = "AADHAAR";
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await expect(
        ipfsDocumentManager.connect(verifier1).uploadDocument(
          ipfsHash,
          documentType,
          expiryTimestamp
        )
      ).to.be.revertedWith("Caller is not a user");
    });

    it("Should allow verifiers to verify documents", async function () {
      const ipfsHash = "QmTest1";
      const documentType = "AADHAAR";
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await ipfsDocumentManager.connect(user1).uploadDocument(
        ipfsHash,
        documentType,
        expiryTimestamp
      );

      await identityRegistry.connect(verifier1).verifyDocument(ipfsHash);
      const [isVerified] = await identityRegistry.getDID(user1.address);
      expect(isVerified).to.be.true;
    });

    it("Should not allow non-verifiers to verify documents", async function () {
      const ipfsHash = "QmTest1";
      const documentType = "AADHAAR";
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      await ipfsDocumentManager.connect(user1).uploadDocument(
        ipfsHash,
        documentType,
        expiryTimestamp
      );

      await expect(
        identityRegistry.connect(user1).verifyDocument(ipfsHash)
      ).to.be.revertedWith("Caller is not a verifier");
    });
  });

  describe("System Configuration", function () {
    it("Should allow admin to update system config", async function () {
      const config = {
        verificationFee: ethers.utils.parseEther("0.2"),
        documentExpiryTime: 180 * 24 * 60 * 60, // 6 months
        maxVerificationAttempts: 5,
        allowMultipleDIDs: true
      };

      await baseIdentity.updateSystemConfig(config);
      const updatedConfig = await baseIdentity.config();
      expect(updatedConfig.verificationFee).to.equal(config.verificationFee);
      expect(updatedConfig.documentExpiryTime).to.equal(config.documentExpiryTime);
      expect(updatedConfig.maxVerificationAttempts).to.equal(config.maxVerificationAttempts);
      expect(updatedConfig.allowMultipleDIDs).to.equal(config.allowMultipleDIDs);
    });

    it("Should not allow non-admin to update system config", async function () {
      const config = {
        verificationFee: ethers.utils.parseEther("0.2"),
        documentExpiryTime: 180 * 24 * 60 * 60,
        maxVerificationAttempts: 5,
        allowMultipleDIDs: true
      };

      await expect(
        baseIdentity.connect(verifier1).updateSystemConfig(config)
      ).to.be.revertedWith("Caller is not an admin");
    });
  });
}); 