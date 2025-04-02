# Deployed Smart Contracts on Holesky Testnet

This repository contains information about the deployed smart contracts for the Identity Management System on the Holesky testnet.

## Contract Addresses

1. BaseIdentity: `0x36Ae38FC3772594d398EA9e79627d703aE5E0076`
2. IPFSDocumentManager: `0xfDf99741700039d17dFfBa12b74d4bdc54B3cB66`
3. IdentityRegistry: `0xB9461968ca2261f369668FcF0e0421906CB47EB3`

## Contract Verification

All contracts have been verified on:
- Etherscan: https://holesky.etherscan.io
- Sourcify: https://repo.sourcify.dev

## Network Information

- Network: Holesky Testnet
- Chain ID: 17000
- RPC URL: https://ethereum-holesky.publicnode.com

## System Roles

The IdentityRegistry contract implements the following roles:
- ADMIN_ROLE: System administrators
- USER_ROLE: Regular users
- VERIFIER_ROLE: Document verifiers
- SERVICE_PROVIDER_ROLE: Service providers

## Security Features

- Role-based access control
- Document uniqueness verification
- IPFS integration for document storage
- Secure DID management

## Events

The system emits events for:
- User registration
- Document uploads
- Document verification
- Role assignments
- Access grants/revocations

## Error Handling

The system includes checks for:
- Invalid roles
- Duplicate documents
- Unauthorized access
- Invalid parameters
- Network issues

## Note

This is a documentation-only branch containing information about the deployed contracts. The actual implementation is maintained in the main branch.
