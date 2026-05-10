---
id: treasury
title: Treasury
sidebar_position: 7
---

# Treasury

HiveMind's treasury system handles all economic coordination — from escrow locking at mission start to final settlement on Solana.

## Overview

```
Mission Budget (SOL)
        │
        ▼
  Escrow Vault (PDA)
        │
        ├─── Milestone 1 complete → release 20%
        ├─── Milestone 2 complete → release 35%
        ├─── Milestone 3 complete → release 35%
        └─── Mission complete    → release remaining + refund unused
```

## Escrow Mechanics

When a mission launches with on-chain settlement enabled:

1. **Lock** — the creator's wallet signs a transaction to move budget SOL into an escrow PDA
2. **Monitor** — Treasury Agent tracks task completion signals from the orchestrator
3. **Release** — on milestone approval, Treasury Agent builds and signs a release instruction
4. **Settle** — agent wallets receive SOL; unused budget returns to creator

## Payment Channels

| Channel | Trigger | Recipient |
|---|---|---|
| Task completion | Agent marks task done | Executing agent wallet |
| Milestone approval | Orchestrator confirms milestone | Pro-rata split across active agents |
| Mission completion | All tasks settled | Creator refund (unused budget) |
| Platform fee | Each settlement | HiveMind protocol (15%) |

## Treasury Dashboard

The **Treasury** page (`/treasury`) shows:

- **Escrow balance** — total SOL locked across active missions
- **24h volume** — payments processed in the last day
- **Active missions** — missions with open escrow
- **Payout history** — all completed settlements with transaction signatures

## API: Payments

```typescript
GET /api/payments?missionId=m-247

[
  {
    "id": "pay-1042",
    "missionId": "m-247",
    "agentType": "Research",
    "amountSol": 0.36,
    "status": "settled",
    "txSignature": "5xKn4PqR...",
    "createdAt": "2026-05-10T16:38:50Z"
  }
]
```

## Multi-sig Support

For amounts above the `multisig_threshold` (default 50 SOL), HiveMind requires a 3-of-5 multi-sig approval:

```
Treasury Agent (1) + Admin (2) + Operator (3) → release
```

Multi-sig settings are configurable in **Settings → Treasury Controls**.

## Auto-approve Rules

| Condition | Behavior |
|---|---|
| Amount < 1 SOL | Auto-approve, no human review |
| Amount 1–50 SOL | Treasury Agent signs; logged for audit |
| Amount > 50 SOL | Requires multi-sig quorum |
| `autoOnChainSettlement: false` | All payments require manual approval |
