---
id: on-chain-settlement
title: On-Chain Settlement
sidebar_position: 14
---

# On-Chain Settlement

This guide covers how HiveMind handles end-to-end settlement from mission creation to final payment on Solana.

## Prerequisites

- Solana wallet with SOL (devnet: use `solana airdrop 2`)
- Mission created with `autoOnChainSettlement: true`
- Backend connected to a Solana RPC endpoint

## Settlement Flow

```
1. Creator locks budget → Escrow PDA
2. Mission executes (off-chain)
3. Milestones confirmed by Orchestrator
4. Treasury Agent signs release instructions
5. SOL transferred from Escrow → Agent wallets
6. Reputation PDA updated
7. Unused budget returned to Creator
```

## Step 1: Lock Budget

When a mission is launched, the frontend builds a `lock_escrow` transaction:

```typescript
import { PublicKey, SystemProgram } from "@solana/web3.js";

const [escrowPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("mission_escrow"), missionId],
  PROGRAM_ID,
);

await program.methods
  .lockEscrow(new BN(budget * LAMPORTS_PER_SOL))
  .accounts({
    creator: wallet.publicKey,
    escrow: escrowPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Step 2: Milestone Release

The Treasury Agent calls `release_milestone` as tasks complete:

```typescript
await program.methods
  .releaseMilestone(milestoneIndex, new BN(releaseAmountLamports))
  .accounts({
    authority: treasuryAgentKey,
    escrow: escrowPda,
    recipient: agentWallet,
  })
  .rpc();
```

## Step 3: Final Settlement

After mission completion:

```typescript
await program.methods
  .settleMission()
  .accounts({
    authority: treasuryAgentKey,
    escrow: escrowPda,
    creator: creatorWallet,
  })
  .rpc();
```

This:
- Releases any remaining milestone payments
- Returns unused budget to the creator
- Closes the escrow PDA (reclaims rent)

## Monitoring Transactions

All settlement transactions appear in the **Treasury** page under "Recent Payouts" with links to the Solana Explorer.

You can also monitor directly:

```bash
solana confirm -v <tx-signature> --url devnet
```

## Failure Handling

If a mission fails or is cancelled:

| Scenario | Outcome |
|---|---|
| Creator cancels before execution | Full refund from escrow |
| Agent timeout (> 12h) | Partial refund proportional to completed work |
| Dispute raised | Funds held in escrow pending governance vote |
| Network error during settlement | Treasury Agent retries with exponential backoff |

## Testing on Devnet

```bash
# Airdrop SOL for testing
solana airdrop 2 <your-wallet-address> --url devnet

# Check escrow balance
solana account <escrow-pda> --url devnet

# Verify settlement
solana confirm <tx-signature> --url devnet
```
