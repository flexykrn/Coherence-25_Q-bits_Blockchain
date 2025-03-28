// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BaseDID is Ownable, ReentrancyGuard, Pausable {
    using Strings for string;
    using Counters for Counters.Counter;

    struct DID {
        string identifier;
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
        bool isRevoked;
        string revocationReason;
    }

    struct Attribute {
        string value;
        uint256 timestamp;
        bool isVerified;
        address verifiedBy;
    }

    DID public selfDID;
    mapping(string => Attribute) public attributes;
    mapping(address => mapping(string => bool)) public authorizedAccess;
    mapping(string => bool) public supportedIDTypes;
    mapping(string => bool) private usedIdentifiers;
    Counters.Counter private _attributeCount;
    mapping(address => DID[]) public userDIDs;

    uint256 public constant MAX_ATTRIBUTES = 50;
    uint256 public constant MAX_IDENTIFIER_LENGTH = 100;
    uint256 public constant MAX_ATTRIBUTE_LENGTH = 1000;

    event DIDCreated(string identifier, address indexed owner);
    event DIDDeactivated(string identifier);
    event AttributeAdded(string name, string value);
    event AttributeRemoved(string name);
    event AccessGranted(address indexed to, string attribute);
    event AccessRevoked(address indexed to, string attribute);
    event DIDRevoked(string identifier, string reason);
    event AttributeVerified(string name, address indexed verifier);

    modifier whenNotRevoked() {
        require(!selfDID.isRevoked, "DID has been revoked");
        _;
    }

    modifier validIdentifier(string memory identifier) {
        require(bytes(identifier).length > 0, "Identifier cannot be empty");
        require(bytes(identifier).length <= MAX_IDENTIFIER_LENGTH, "Identifier too long");
        require(!usedIdentifiers[identifier], "Identifier already in use");
        _;
    }

    modifier validAttribute(string memory name, string memory value) {
        require(bytes(name).length > 0, "Attribute name cannot be empty");
        require(bytes(name).length <= MAX_ATTRIBUTE_LENGTH, "Attribute name too long");
        require(bytes(value).length > 0, "Attribute value cannot be empty");
        require(bytes(value).length <= MAX_ATTRIBUTE_LENGTH, "Attribute value too long");
        _;
    }

    modifier onlyDIDOwner(uint256 didIndex) {
        require(msg.sender == owner(), "Not the DID owner");
        _;
    }

    constructor() {
        selfDID.createdAt = block.timestamp;
        selfDID.updatedAt = block.timestamp;
        selfDID.active = true;
    }

    function createDID(string memory identifier) 
        public 
        virtual 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        validIdentifier(identifier) 
        returns (bool) 
    {
        require(bytes(selfDID.identifier).length == 0, "DID already exists");
        
        selfDID.identifier = identifier;
        selfDID.createdAt = block.timestamp;
        selfDID.updatedAt = block.timestamp;
        selfDID.active = true;
        usedIdentifiers[identifier] = true;
        
        emit DIDCreated(identifier, msg.sender);
        return true;
    }

    function deactivateDID() 
        public 
        virtual 
        onlyOwner 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        returns (bool) 
    {
        require(selfDID.active, "DID is already inactive");
        selfDID.active = false;
        selfDID.updatedAt = block.timestamp;
        emit DIDDeactivated(selfDID.identifier);
        return true;
    }

    function revokeDID(string memory reason) 
        public 
        onlyOwner 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        returns (bool) 
    {
        require(bytes(reason).length > 0, "Revocation reason required");
        selfDID.isRevoked = true;
        selfDID.revocationReason = reason;
        selfDID.active = false;
        selfDID.updatedAt = block.timestamp;
        emit DIDRevoked(selfDID.identifier, reason);
        return true;
    }

    function addAttribute(string memory name, string memory value) 
        public 
        virtual 
        onlyOwner 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        validAttribute(name, value) 
        returns (bool) 
    {
        require(_attributeCount.current() < MAX_ATTRIBUTES, "Maximum attributes reached");
        
        attributes[name] = Attribute({
            value: value,
            timestamp: block.timestamp,
            isVerified: false,
            verifiedBy: address(0)
        });
        
        _attributeCount.increment();
        selfDID.updatedAt = block.timestamp;
        emit AttributeAdded(name, value);
        return true;
    }

    function removeAttribute(string memory name) 
        public 
        virtual 
        onlyOwner 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        returns (bool) 
    {
        require(bytes(attributes[name].value).length > 0, "Attribute does not exist");
        
        delete attributes[name];
        _attributeCount.decrement();
        selfDID.updatedAt = block.timestamp;
        emit AttributeRemoved(name);
        return true;
    }

    function verifyAttribute(string memory name, address verifier) 
        public 
        onlyOwner 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        returns (bool) 
    {
        require(bytes(attributes[name].value).length > 0, "Attribute does not exist");
        require(verifier != address(0), "Invalid verifier address");
        
        attributes[name].isVerified = true;
        attributes[name].verifiedBy = verifier;
        attributes[name].timestamp = block.timestamp;
        
        emit AttributeVerified(name, verifier);
        return true;
    }

    function getAttribute(string memory name) 
        public 
        view 
        virtual 
        whenNotRevoked 
        returns (string memory) 
    {
        require(bytes(attributes[name].value).length > 0, "Attribute does not exist");
        require(
            msg.sender == owner() || authorizedAccess[msg.sender][name],
            "Not authorized to access this attribute"
        );
        return attributes[name].value;
    }

    function getAttributeDetails(string memory name) 
        public 
        view 
        whenNotRevoked 
        returns (
            string memory value,
            uint256 timestamp,
            bool isVerified,
            address verifiedBy
        ) 
    {
        require(bytes(attributes[name].value).length > 0, "Attribute does not exist");
        require(
            msg.sender == owner() || authorizedAccess[msg.sender][name],
            "Not authorized to access this attribute"
        );
        
        Attribute memory attr = attributes[name];
        return (attr.value, attr.timestamp, attr.isVerified, attr.verifiedBy);
    }

    function grantAccess(uint256 didIndex, address to, string memory attribute) 
        public 
        virtual 
        onlyOwner 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        returns (bool) 
    {
        require(to != address(0), "Invalid address");
        require(didIndex < userDIDs[msg.sender].length, "DID does not exist");
        authorizedAccess[to][attribute] = true;
        emit AccessGranted(to, attribute);
        return true;
    }

    function revokeAccess(address from, string memory attribute) 
        public 
        virtual 
        onlyOwner 
        whenNotPaused 
        whenNotRevoked 
        nonReentrant 
        returns (bool) 
    {
        require(from != address(0), "Invalid address");
        authorizedAccess[from][attribute] = false;
        emit AccessRevoked(from, attribute);
        return true;
    }

    function hasAccess(address owner, uint256 didIndex, address accessor, string memory attribute) 
        public 
        view 
        returns (bool) 
    {
        require(didIndex < userDIDs[owner].length, "DID does not exist");
        return owner == accessor || authorizedAccess[accessor][attribute];
    }

    function getDIDDetails() 
        public 
        view 
        whenNotRevoked 
        returns (
            string memory identifier,
            bool active,
            uint256 createdAt,
            uint256 updatedAt,
            bool isRevoked,
            string memory revocationReason
        ) 
    {
        return (
            selfDID.identifier,
            selfDID.active,
            selfDID.createdAt,
            selfDID.updatedAt,
            selfDID.isRevoked,
            selfDID.revocationReason
        );
    }

    function getAttributeCount() public view returns (uint256) {
        return _attributeCount.current();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
} 