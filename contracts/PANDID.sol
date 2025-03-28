// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseDID.sol";

contract PANDID is BaseDID {
    struct PANDetails {
        string name;
        string dateOfBirth;
        string gender;
        string addr;
        string panNumber;
    }

    mapping(uint256 => PANDetails) public panDetails;

    event PANCreated(address indexed owner, string identifier, string panNumber);

    function createPANDID(
        string memory identifier,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory panNumber
    ) external {
        createDID(identifier);
        
        uint256 didIndex = userDIDs[msg.sender].length - 1;
        panDetails[didIndex] = PANDetails({
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            addr: addr,
            panNumber: panNumber
        });

        grantAccess(didIndex, msg.sender, "name");
        grantAccess(didIndex, msg.sender, "dateOfBirth");
        grantAccess(didIndex, msg.sender, "gender");
        grantAccess(didIndex, msg.sender, "addr");
        grantAccess(didIndex, msg.sender, "panNumber");

        emit PANCreated(msg.sender, identifier, panNumber);
    }

    function getPANDetails(address owner, uint256 didIndex) external view returns (
        string memory identifier,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory panNumber,
        bool active,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        require(didIndex < userDIDs[owner].length, "DID does not exist");
        require(hasAccess(owner, didIndex, msg.sender, "name"), "Not authorized to access PAN details");
        
        DID storage userDID = userDIDs[owner][didIndex];
        PANDetails storage details = panDetails[didIndex];
        
        return (
            userDID.identifier,
            details.name,
            details.dateOfBirth,
            details.gender,
            details.addr,
            details.panNumber,
            userDID.active,
            userDID.createdAt,
            userDID.updatedAt
        );
    }

    function getPANAttribute(address owner, uint256 didIndex, string memory attribute) external view returns (string memory) {
        require(didIndex < userDIDs[owner].length, "DID does not exist");
        require(hasAccess(owner, didIndex, msg.sender, attribute), "Not authorized to access this attribute");
        
        PANDetails storage details = panDetails[didIndex];
        
        if (keccak256(bytes(attribute)) == keccak256(bytes("name"))) return details.name;
        if (keccak256(bytes(attribute)) == keccak256(bytes("dateOfBirth"))) return details.dateOfBirth;
        if (keccak256(bytes(attribute)) == keccak256(bytes("gender"))) return details.gender;
        if (keccak256(bytes(attribute)) == keccak256(bytes("addr"))) return details.addr;
        if (keccak256(bytes(attribute)) == keccak256(bytes("panNumber"))) return details.panNumber;
        
        revert("Invalid attribute");
    }

    function updatePANDetails(
        uint256 didIndex,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory addr,
        string memory panNumber
    ) external onlyDIDOwner(didIndex) {
        panDetails[didIndex] = PANDetails({
            name: name,
            dateOfBirth: dateOfBirth,
            gender: gender,
            addr: addr,
            panNumber: panNumber
        });
        
        userDIDs[msg.sender][didIndex].updatedAt = block.timestamp;
    }
} 