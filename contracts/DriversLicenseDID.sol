// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseDID.sol";

contract DriversLicenseDID is BaseDID {
    struct DriversLicenseDetails {
        string name;
        string dateOfBirth;
        string gender;
        string addr;
        string photoHash;
        string signatureHash;
        string licenseNumber;
        string vehicleClass;
        string issueDate;
        string expiryDate;
        string bloodGroup;
        string emergencyContact;
    }

    mapping(uint256 => DriversLicenseDetails) public licenseDetails;

    event DriversLicenseCreated(address indexed owner, string identifier, string licenseNumber);

    function createDriversLicenseDID(
        string memory identifier,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory photoHash,
        string memory signatureHash,
        string memory licenseNumber,
        string memory vehicleClass,
        string memory issueDate,
        string memory expiryDate,
        string memory bloodGroup,
        string memory emergencyContact
    ) external {
        createDID(identifier);
        
        uint256 didIndex = userDIDs[msg.sender].length - 1;
        licenseDetails[didIndex] = DriversLicenseDetails({
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            addr: addr,
            photoHash: photoHash,
            signatureHash: signatureHash,
            licenseNumber: licenseNumber,
            vehicleClass: vehicleClass,
            issueDate: issueDate,
            expiryDate: expiryDate,
            bloodGroup: bloodGroup,
            emergencyContact: emergencyContact
        });

        grantAccess(didIndex, msg.sender, "name");
        grantAccess(didIndex, msg.sender, "dateOfBirth");
        grantAccess(didIndex, msg.sender, "gender");
        grantAccess(didIndex, msg.sender, "addr");
        grantAccess(didIndex, msg.sender, "photoHash");
        grantAccess(didIndex, msg.sender, "signatureHash");
        grantAccess(didIndex, msg.sender, "licenseNumber");
        grantAccess(didIndex, msg.sender, "vehicleClass");
        grantAccess(didIndex, msg.sender, "issueDate");
        grantAccess(didIndex, msg.sender, "expiryDate");
        grantAccess(didIndex, msg.sender, "bloodGroup");
        grantAccess(didIndex, msg.sender, "emergencyContact");

        emit DriversLicenseCreated(msg.sender, identifier, licenseNumber);
    }

    function getDriversLicenseDetails(address owner, uint256 didIndex) external view returns (
        string memory identifier,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory photoHash,
        string memory signatureHash,
        string memory licenseNumber,
        string memory vehicleClass,
        string memory issueDate,
        string memory expiryDate,
        string memory bloodGroup,
        string memory emergencyContact,
        bool active,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        require(didIndex < userDIDs[owner].length, "DID does not exist");
        require(hasAccess(owner, didIndex, msg.sender, "name"), "Not authorized to access Drivers License details");
        
        DID storage userDID = userDIDs[owner][didIndex];
        DriversLicenseDetails storage details = licenseDetails[didIndex];
        
        return (
            userDID.identifier,
            details.name,
            details.dateOfBirth,
            details.gender,
            details.addr,
            details.photoHash,
            details.signatureHash,
            details.licenseNumber,
            details.vehicleClass,
            details.issueDate,
            details.expiryDate,
            details.bloodGroup,
            details.emergencyContact,
            userDID.active,
            userDID.createdAt,
            userDID.updatedAt
        );
    }

    function getDriversLicenseAttribute(address owner, uint256 didIndex, string memory attribute) external view returns (string memory) {
        require(didIndex < userDIDs[owner].length, "DID does not exist");
        require(hasAccess(owner, didIndex, msg.sender, attribute), "Not authorized to access this attribute");
        
        DriversLicenseDetails storage details = licenseDetails[didIndex];
        
        if (keccak256(bytes(attribute)) == keccak256(bytes("name"))) return details.name;
        if (keccak256(bytes(attribute)) == keccak256(bytes("dateOfBirth"))) return details.dateOfBirth;
        if (keccak256(bytes(attribute)) == keccak256(bytes("gender"))) return details.gender;
        if (keccak256(bytes(attribute)) == keccak256(bytes("addr"))) return details.addr;
        if (keccak256(bytes(attribute)) == keccak256(bytes("photoHash"))) return details.photoHash;
        if (keccak256(bytes(attribute)) == keccak256(bytes("signatureHash"))) return details.signatureHash;
        if (keccak256(bytes(attribute)) == keccak256(bytes("licenseNumber"))) return details.licenseNumber;
        if (keccak256(bytes(attribute)) == keccak256(bytes("vehicleClass"))) return details.vehicleClass;
        if (keccak256(bytes(attribute)) == keccak256(bytes("issueDate"))) return details.issueDate;
        if (keccak256(bytes(attribute)) == keccak256(bytes("expiryDate"))) return details.expiryDate;
        if (keccak256(bytes(attribute)) == keccak256(bytes("bloodGroup"))) return details.bloodGroup;
        if (keccak256(bytes(attribute)) == keccak256(bytes("emergencyContact"))) return details.emergencyContact;
        
        revert("Invalid attribute");
    }

    function updateDriversLicenseDetails(
        uint256 didIndex,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory photoHash,
        string memory signatureHash,
        string memory licenseNumber,
        string memory vehicleClass,
        string memory issueDate,
        string memory expiryDate,
        string memory bloodGroup,
        string memory emergencyContact
    ) external onlyDIDOwner(didIndex) {
        licenseDetails[didIndex] = DriversLicenseDetails({
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            addr: addr,
            photoHash: photoHash,
            signatureHash: signatureHash,
            licenseNumber: licenseNumber,
            vehicleClass: vehicleClass,
            issueDate: issueDate,
            expiryDate: expiryDate,
            bloodGroup: bloodGroup,
            emergencyContact: emergencyContact
        });
        
        userDIDs[msg.sender][didIndex].updatedAt = block.timestamp;
    }
} 