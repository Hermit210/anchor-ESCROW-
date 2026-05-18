# Escrow Program

A TypeScript implementation of a secure escrow system built with Solana Web3.js and tested with Vitest.

## Overview

This escrow program manages the secure transfer of funds between a buyer and seller with the help of an arbiter. It supports multiple states and operations:

- **Pending**: Initial state when escrow is created
- **Released**: Funds transferred to seller
- **Refunded**: Funds returned to buyer
- **Disputed**: Awaiting arbiter resolution

## Features

### Core Operations

1. **Create Escrow** - Initialize a new escrow agreement
   - Requires: buyer, seller, arbiter addresses and amount
   - Returns: unique escrow ID
   - Validates: amount must be > 0

2. **Release Escrow** - Transfer funds to seller
   - Authorized by: buyer or arbiter
   - Transitions: pending → released
   - Prevents: double-release, release of refunded/disputed escrows

3. **Refund Escrow** - Return funds to buyer
   - Authorized by: seller or arbiter
   - Transitions: pending → refunded
   - Prevents: double-refund, refund of released/disputed escrows

4. **Dispute Escrow** - Escalate to arbiter
   - Initiated by: buyer or seller
   - Transitions: pending → disputed
   - Prevents: dispute of already resolved escrows

5. **Resolve Dispute** - Arbiter decides outcome
   - Authorized by: arbiter only
   - Transitions: disputed → released or refunded
   - Requires: dispute status

## Installation

```bash
npm install
```

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Coverage

The test suite includes 34 comprehensive tests covering:

- **Creation**: Valid creation, amount validation, unique IDs
- **Release**: Authorization checks, state transitions, error cases
- **Refund**: Authorization checks, state transitions, error cases
- **Dispute**: Initiation, authorization, state transitions
- **Resolution**: Arbiter decisions, state transitions
- **Integration**: Complete workflows, concurrent escrows

### Test Results

```
Test Files  1 passed (1)
     Tests  34 passed (34)
  Duration  656ms
```

All tests passing ✓
<img width="1509" height="1057" alt="image" src="https://github.com/user-attachments/assets/e4b9e938-5b3a-466d-9144-977254f524a6" />

## Project Structure

```
.
├── src/
│   ├── escrow.ts          # Main escrow program implementation
│   └── escrow.test.ts     # Comprehensive test suite
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Usage Example

```typescript
import { EscrowProgram } from "./src/escrow";
import { Keypair } from "@solana/web3.js";

// Initialize program
const program = new EscrowProgram();

// Generate keypairs
const buyer = Keypair.generate().publicKey;
const seller = Keypair.generate().publicKey;
const arbiter = Keypair.generate().publicKey;

// Create escrow
const escrowId = program.createEscrow(buyer, seller, arbiter, 1000n);

// Buyer releases funds to seller
program.releaseEscrow(escrowId, buyer);

// Check status
const escrow = program.getEscrow(escrowId);
console.log(escrow?.status); // "released"
```

## API Reference

### EscrowProgram

#### `createEscrow(buyer, seller, arbiter, amount): string`
Creates a new escrow agreement.

**Parameters:**
- `buyer` (PublicKey): Buyer's wallet address
- `seller` (PublicKey): Seller's wallet address
- `arbiter` (PublicKey): Arbiter's wallet address
- `amount` (bigint): Amount in lamports

**Returns:** Unique escrow ID

**Throws:** Error if amount ≤ 0

---

#### `getEscrow(escrowId): EscrowState | null`
Retrieves escrow details.

**Parameters:**
- `escrowId` (string): Escrow identifier

**Returns:** EscrowState object or null if not found

---

#### `releaseEscrow(escrowId, caller): void`
Releases funds to seller.

**Parameters:**
- `escrowId` (string): Escrow identifier
- `caller` (PublicKey): Transaction caller (must be buyer or arbiter)

**Throws:** Error if unauthorized or invalid state

---

#### `refundEscrow(escrowId, caller): void`
Refunds funds to buyer.

**Parameters:**
- `escrowId` (string): Escrow identifier
- `caller` (PublicKey): Transaction caller (must be seller or arbiter)

**Throws:** Error if unauthorized or invalid state

---

#### `disputeEscrow(escrowId, caller): void`
Initiates dispute resolution.

**Parameters:**
- `escrowId` (string): Escrow identifier
- `caller` (PublicKey): Transaction caller (must be buyer or seller)

**Throws:** Error if unauthorized or invalid state

---

#### `resolveDispute(escrowId, caller, releaseToSeller): void`
Resolves dispute (arbiter only).

**Parameters:**
- `escrowId` (string): Escrow identifier
- `caller` (PublicKey): Transaction caller (must be arbiter)
- `releaseToSeller` (boolean): true = release to seller, false = refund to buyer

**Throws:** Error if unauthorized or not in disputed state

---

## State Transitions

```
pending
  ├─→ released (via releaseEscrow)
  ├─→ refunded (via refundEscrow)
  └─→ disputed (via disputeEscrow)
       └─→ released or refunded (via resolveDispute)
```

## Security Considerations

- **Authorization**: All operations validate caller permissions
- **State Validation**: Prevents invalid state transitions
- **Amount Validation**: Rejects zero or negative amounts
- **Immutability**: Once resolved, escrows cannot be modified

## Dependencies

- `@solana/web3.js`: Solana blockchain interaction
- `@coral-xyz/anchor`: Anchor framework utilities
- `typescript`: Type safety
- `vitest`: Testing framework

## License

ISC
