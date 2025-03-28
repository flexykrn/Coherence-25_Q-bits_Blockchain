// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseDID.sol";

contract AadharDID is BaseDID {
    struct AadharDetails {
        string name;
        string dateOfBirth;
        string gender;
        string addr;
        string photoHash;
        string aadharNumber;
    }

    mapping(uint256 => AadharDetails) public aadharDetails;

    event AadharCreated(address indexed owner, string identifier, string aadharNumber);

    function createAadharDID(
        string memory identifier,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory photoHash,
        string memory aadharNumber
    ) external {
        createDID(identifier);
        
        uint256 didIndex = userDIDs[msg.sender].length - 1;
        aadharDetails[didIndex] = AadharDetails({
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            addr: addr,
            photoHash: photoHash,
            aadharNumber: aadharNumber
        });

        // Grant access to all attributes to the owner
        grantAccess(didIndex, msg.sender, "name");
        grantAccess(didIndex, msg.sender, "dateOfBirth");
        grantAccess(didIndex, msg.sender, "gender");
        grantAccess(didIndex, msg.sender, "addr");
        grantAccess(didIndex, msg.sender, "photoHash");
        grantAccess(didIndex, msg.sender, "aadharNumber");

        emit AadharCreated(msg.sender, identifier, aadharNumber);
    }

    function getAadharDetails(address owner, uint256 didIndex) external view returns (
        string memory identifier,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory photoHash,
        string memory aadharNumber,
        bool active,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        require(didIndex < userDIDs[owner].length, "DID does not exist");
        require(hasAccess(owner, didIndex, msg.sender, "name"), "Not authorized to access Aadhar details");
        
        DID storage userDID = userDIDs[owner][didIndex];
        AadharDetails storage details = aadharDetails[didIndex];
        
        return (
            userDID.identifier,
            details.name,
            details.dateOfBirth,
            details.gender,
            details.addr,
            details.photoHash,
            details.aadharNumber,
            userDID.active,
            userDID.createdAt,
            userDID.updatedAt
        );
    }

    function getAadharAttribute(address owner, uint256 didIndex, string memory attribute) external view returns (string memory) {
        require(didIndex < userDIDs[owner].length, "DID does not exist");
        require(hasAccess(owner, didIndex, msg.sender, attribute), "Not authorized to access this attribute");
        
        AadharDetails storage details = aadharDetails[didIndex];
        
        if (keccak256(bytes(attribute)) == keccak256(bytes("name"))) return details.name;
        if (keccak256(bytes(attribute)) == keccak256(bytes("dateOfBirth"))) return details.dateOfBirth;
        if (keccak256(bytes(attribute)) == keccak256(bytes("gender"))) return details.gender;
        if (keccak256(bytes(attribute)) == keccak256(bytes("addr"))) return details.addr;
        if (keccak256(bytes(attribute)) == keccak256(bytes("photoHash"))) return details.photoHash;
        if (keccak256(bytes(attribute)) == keccak256(bytes("aadharNumber"))) return details.aadharNumber;
        
        revert("Invalid attribute");
    }

    function updateAadharDetails(
        uint256 didIndex,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory photoHash,
        string memory aadharNumber
    ) external onlyDIDOwner(didIndex) {
        aadharDetails[didIndex] = AadharDetails({
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            addr: addr,
            photoHash: photoHash,
            aadharNumber: aadharNumber
        });
        
        userDIDs[msg.sender][didIndex].updatedAt = block.timestamp;
    }
} 