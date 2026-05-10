---
id: contracts
title: Smart Contracts
sidebar_position: 9
---

# Smart Contracts

HiveMind's on-chain program is built with **Anchor 0.30** on Solana.

## Program ID

```
EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om
```

Network: **Devnet** (mainnet deployment TBD)

## PDAs

### HivemindConfig

Global protocol configuration. Created once by the program admin.

```rust
pub struct HivemindConfig {
    pub admin: Pubkey,
    pub fee_rate_bps: u16,    // platform fee in basis points
    pub bump: u8,
}
```

Seeds: `["hivemind_config"]`

### FreeTrialConfig

Parameters for the free trial program.

```rust
pub struct FreeTrialConfig {
    pub admin: Pubkey,
    pub free_uses_total: u8,       // total free uses per wallet
    pub daily_hive_amount: u64,    // HIVE tokens claimable daily
    pub bump: u8,
}
```

Seeds: `["free_trial_config"]`

### UserTrial (per wallet)

Per-wallet trial state.

```rust
pub struct UserTrial {
    pub wallet: Pubkey,
    pub uses_remaining: u8,
    pub last_claim_at: i64,    // Unix timestamp
    pub bump: u8,
}
```

Seeds: `["user_trial", wallet]`

## Instructions

### `initialize`

Bootstrap the `HivemindConfig` and `FreeTrialConfig` PDAs. Admin-only.

```typescript
await program.methods.initialize(feeRateBps, freeUsesTotal, dailyHiveAmount)
  .accounts({ admin, hivemindConfig, freeTrialConfig, systemProgram })
  .rpc();
```

### `register_user`

Activate a wallet for the free trial program. Creates `UserTrial` PDA.

```typescript
await program.methods.registerUser()
  .accounts({ user: wallet, userTrial, freeTrialConfig, systemProgram })
  .rpc();
```

### `claim_daily_hive`

Mint daily HIVE tokens to a registered wallet. Enforces 24-hour cooldown.

```typescript
await program.methods.claimDailyHive()
  .accounts({ user: wallet, userTrial, freeTrialConfig, tokenMint, userTokenAccount, tokenProgram })
  .rpc();
```

### `use_free_trial`

Decrement the wallet's remaining free uses.

```typescript
await program.methods.useFreeTrial()
  .accounts({ user: wallet, userTrial, freeTrialConfig })
  .rpc();
```

## Building & Deploying

```bash
cd hivemind-contracts

# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

## Checking On-chain State

```typescript
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

const [hivemindConfigPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("hivemind_config")],
  PROGRAM_ID,
);

const config = await program.account.hivemindConfig.fetch(hivemindConfigPda);
console.log("Admin:", config.admin.toBase58());
console.log("Fee rate:", config.feeRateBps, "bps");
```
