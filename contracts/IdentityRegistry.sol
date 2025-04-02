// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IdentityRegistry is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant SERVICE_PROVIDER_ROLE = keccak256("SERVICE_PROVIDER_ROLE");

    // System configuration
    struct SystemConfig {
        uint256 verificationFee;
        uint256 documentExpiryTime;
        uint256 maxVerificationAttempts;
        bool allowMultipleDIDs;
    }

    SystemConfig public config;

    // Structs
    struct DID {
        string identifier;
        address owner;
        bool isVerified;
        uint256 createdAt;
        uint256 lastUpdated;
        uint256 verificationAttempts;
        string[] documentHashes;
        mapping(string => bool) documentVerificationStatus;
    }

    struct VerificationRequest {
        address user;
        address verifier;
        string documentHash;
        uint256 timestamp;
        bool isPending;
        string rejectionReason;
    }

    // State variables
    mapping(address => DID) public userDIDs;
    mapping(string => VerificationRequest) public verificationRequests;
    mapping(string => bool) public documentExists;
    
    // Events
    event DIDRegistered(address indexed user, string indexed identifier);
    event DocumentUploaded(address indexed user, string indexed documentHash);
    event VerificationRequested(address indexed user, address indexed verifier, string indexed documentHash);
    event DocumentVerified(address indexed user, string indexed documentHash, address indexed verifier);
    event VerificationRejected(address indexed user, string indexed documentHash, string reason);
    event AccessGranted(address indexed user, address indexed serviceProvider);
    event AccessRevoked(address indexed user, address indexed serviceProvider);
    event SystemConfigUpdated(SystemConfig config);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Set default system configuration
        config = SystemConfig({
            verificationFee: 0.1 ether,
            documentExpiryTime: 365 days,
            maxVerificationAttempts: 3,
            allowMultipleDIDs: false
        });
    }

    // Admin functions
    function updateSystemConfig(SystemConfig memory _config) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        config = _config;
        emit SystemConfigUpdated(_config);
    }

    // User functions
    function registerDID(string memory identifier) 
        external 
        onlyRole(USER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        require(!config.allowMultipleDIDs || userDIDs[msg.sender].createdAt == 0, "User already has a DID");
        
        DID storage did = userDIDs[msg.sender];
        did.identifier = identifier;
        did.owner = msg.sender;
        did.createdAt = block.timestamp;
        did.lastUpdated = block.timestamp;
        
        emit DIDRegistered(msg.sender, identifier);
    }

    function uploadDocument(string memory documentHash) 
        external 
        onlyRole(USER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        require(userDIDs[msg.sender].createdAt > 0, "DID not registered");
        require(!documentExists[documentHash], "Document already exists");
        
        DID storage did = userDIDs[msg.sender];
        did.documentHashes.push(documentHash);
        did.lastUpdated = block.timestamp;
        documentExists[documentHash] = true;
        
        emit DocumentUploaded(msg.sender, documentHash);
    }

    function requestVerification(address verifier, string memory documentHash) 
        external 
        onlyRole(USER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        require(hasRole(VERIFIER_ROLE, verifier), "Invalid verifier");
        require(documentExists[documentHash], "Document does not exist");
        require(!verificationRequests[documentHash].isPending, "Verification already requested");
        
        DID storage did = userDIDs[msg.sender];
        require(did.verificationAttempts < config.maxVerificationAttempts, "Max verification attempts reached");
        
        VerificationRequest storage request = verificationRequests[documentHash];
        request.user = msg.sender;
        request.verifier = verifier;
        request.documentHash = documentHash;
        request.timestamp = block.timestamp;
        request.isPending = true;
        
        emit VerificationRequested(msg.sender, verifier, documentHash);
    }

    // Verifier functions
    function verifyDocument(string memory documentHash) 
        external 
        onlyRole(VERIFIER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        VerificationRequest storage request = verificationRequests[documentHash];
        require(request.isPending, "No pending verification request");
        require(request.verifier == msg.sender, "Not authorized to verify this document");
        
        DID storage did = userDIDs[request.user];
        did.documentVerificationStatus[documentHash] = true;
        did.verificationAttempts++;
        did.lastUpdated = block.timestamp;
        
        request.isPending = false;
        
        emit DocumentVerified(request.user, documentHash, msg.sender);
    }

    function rejectVerification(string memory documentHash, string memory reason) 
        external 
        onlyRole(VERIFIER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        VerificationRequest storage request = verificationRequests[documentHash];
        require(request.isPending, "No pending verification request");
        require(request.verifier == msg.sender, "Not authorized to reject this document");
        
        DID storage did = userDIDs[request.user];
        did.verificationAttempts++;
        did.lastUpdated = block.timestamp;
        
        request.isPending = false;
        request.rejectionReason = reason;
        
        emit VerificationRejected(request.user, documentHash, reason);
    }

    // Service Provider functions
    function grantAccess(address user) 
        external 
        onlyRole(SERVICE_PROVIDER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        require(userDIDs[user].isVerified, "User not verified");
        emit AccessGranted(user, msg.sender);
    }

    function checkAccess(address user) 
        external 
        view 
        onlyRole(SERVICE_PROVIDER_ROLE)
        returns (bool) 
    {
        return userDIDs[user].isVerified;
    }

    // View functions
    function getDID(address user) 
        external 
        view 
        returns (
            string memory identifier,
            bool isVerified,
            uint256 createdAt,
            uint256 lastUpdated,
            uint256 verificationAttempts,
            string[] memory documentHashes
        ) 
    {
        DID storage did = userDIDs[user];
        return (
            did.identifier,
            did.isVerified,
            did.createdAt,
            did.lastUpdated,
            did.verificationAttempts,
            did.documentHashes
        );
    }

    function getVerificationRequest(string memory documentHash) 
        external 
        view 
        returns (
            address user,
            address verifier,
            uint256 timestamp,
            bool isPending,
            string memory rejectionReason
        ) 
    {
        VerificationRequest storage request = verificationRequests[documentHash];
        return (
            request.user,
            request.verifier,
            request.timestamp,
            request.isPending,
            request.rejectionReason
        );
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 