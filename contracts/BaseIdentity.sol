// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BaseIdentity is AccessControl, Pausable, ReentrancyGuard {
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

    // Events
    event SystemConfigUpdated(SystemConfig config);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
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

    // Modifiers
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    modifier onlyUser() {
        require(hasRole(USER_ROLE, msg.sender), "Caller is not a user");
        _;
    }

    modifier onlyVerifier() {
        require(hasRole(VERIFIER_ROLE, msg.sender), "Caller is not a verifier");
        _;
    }

    modifier onlyServiceProvider() {
        require(hasRole(SERVICE_PROVIDER_ROLE, msg.sender), "Caller is not a service provider");
        _;
    }
} 