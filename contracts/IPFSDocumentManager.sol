// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IPFSDocumentManager is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant SERVICE_PROVIDER_ROLE = keccak256("SERVICE_PROVIDER_ROLE");

    // Structs
    struct Document {
        string ipfsHash;
        string documentType;
        uint256 uploadTimestamp;
        uint256 expiryTimestamp;
        bool isActive;
        address uploadedBy;
        string[] verificationHashes;
    }

    // State variables
    mapping(string => Document) public documents;
    mapping(address => string[]) public userDocuments;
    mapping(string => bool) public documentTypes;

    // Events
    event DocumentUploaded(address indexed user, string indexed ipfsHash, string documentType);
    event DocumentVerified(string indexed ipfsHash, address indexed verifier);
    event DocumentTypeAdded(string indexed documentType);
    event DocumentTypeRemoved(string indexed documentType);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Initialize default document types
        documentTypes["AADHAAR"] = true;
        documentTypes["PAN"] = true;
        documentTypes["DRIVING_LICENSE"] = true;
        documentTypes["PASSPORT"] = true;
    }

    // Admin functions
    function addDocumentType(string memory documentType) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        require(!documentTypes[documentType], "Document type already exists");
        documentTypes[documentType] = true;
        emit DocumentTypeAdded(documentType);
    }

    function removeDocumentType(string memory documentType) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        require(documentTypes[documentType], "Document type does not exist");
        documentTypes[documentType] = false;
        emit DocumentTypeRemoved(documentType);
    }

    // User functions
    function uploadDocument(
        string memory ipfsHash,
        string memory documentType,
        uint256 expiryTimestamp
    ) 
        external 
        onlyRole(USER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        require(documentTypes[documentType], "Invalid document type");
        require(expiryTimestamp > block.timestamp, "Invalid expiry timestamp");
        require(documents[ipfsHash].uploadTimestamp == 0, "Document already exists");

        Document storage doc = documents[ipfsHash];
        doc.ipfsHash = ipfsHash;
        doc.documentType = documentType;
        doc.uploadTimestamp = block.timestamp;
        doc.expiryTimestamp = expiryTimestamp;
        doc.isActive = true;
        doc.uploadedBy = msg.sender;

        userDocuments[msg.sender].push(ipfsHash);
        emit DocumentUploaded(msg.sender, ipfsHash, documentType);
    }

    // Verifier functions
    function verifyDocument(string memory ipfsHash, string memory verificationHash) 
        external 
        onlyRole(VERIFIER_ROLE)
        whenNotPaused 
        nonReentrant 
    {
        require(documents[ipfsHash].uploadTimestamp > 0, "Document does not exist");
        require(documents[ipfsHash].isActive, "Document is not active");
        require(block.timestamp < documents[ipfsHash].expiryTimestamp, "Document has expired");

        documents[ipfsHash].verificationHashes.push(verificationHash);
        emit DocumentVerified(ipfsHash, msg.sender);
    }

    // View functions
    function getDocument(string memory ipfsHash) 
        external 
        view 
        returns (
            string memory documentType,
            uint256 uploadTimestamp,
            uint256 expiryTimestamp,
            bool isActive,
            address uploadedBy,
            string[] memory verificationHashes
        ) 
    {
        Document storage doc = documents[ipfsHash];
        return (
            doc.documentType,
            doc.uploadTimestamp,
            doc.expiryTimestamp,
            doc.isActive,
            doc.uploadedBy,
            doc.verificationHashes
        );
    }

    function getUserDocuments(address user) 
        external 
        view 
        returns (string[] memory) 
    {
        return userDocuments[user];
    }

    function isDocumentTypeValid(string memory documentType) 
        external 
        view 
        returns (bool) 
    {
        return documentTypes[documentType];
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 