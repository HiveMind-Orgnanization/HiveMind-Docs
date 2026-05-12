---
id: treasury
title: Treasury
sidebar_position: 7
---

# Treasury

The Treasury page (`/treasury`) is HiveMind's economic dashboard. It aggregates every SOL movement across a wallet's missions: the budget committed, the budget currently locked in active escrows, the SOL paid out to agents, and the SOL released after mission completion.

---

## The Four Buckets

Treasury partitions a wallet's SOL into four logical buckets:

| Bucket | Source | Meaning |
|---|---|---|
| **Mission Reserve** | `Σ mission.budget` across all missions | Total SOL committed to HiveMind |
| **Active Escrow** | `Σ mission.budget` where `status === "active"` | Currently locked in running missions |
| **Agent Payouts** | `Σ payment.amountSol` from `/api/payments` | SOL paid out to agents |
| **Completed Vault** | `Σ mission.budget` where `status === "completed"` | Released after settlement |

These aren't four separate pools — Active Escrow and Completed Vault are *subsets* of Mission Reserve. Treasury's Total Treasury number reflects Mission Reserve (the super-set) so the headline doesn't double-count.

---

## The Composition Bar

The thin gradient bar under the Total Treasury number partitions Mission Reserve into three disjoint subsets that sum to 100%:

- **Active Escrow** (amber) — locked
- **Completed Vault** (purple) — released
- **Queued / Reserved** (cyan) — committed but not yet active

---

## Live Solana SLOT

The slot counter in the page header is **live** — polled from your devnet RPC connection every 5 seconds via `useConnection().getSlot()`. Not a clock animation. The label below reads "Solana devnet · live" so the network is unambiguous.

---

## Cashflow Chart

The cashflow chart below the hero is derived from real `/api/payments` data over the selected window (24h / 7d / 30d):

- **Inflow** (emerald) — payments where `recipientPubkey === VITE_HM_TREASURY_PUBKEY` (deposits to treasury)
- **Outflow** (amber) — every other payment (agent payouts)

The chart cumulates running totals so each point is *"how much has moved in/out so far,"* not a per-bucket spike. The Inflow / Outflow / Net cards under the chart show the actual numbers; they display `—` until real data exists. If you're staring at a fresh wallet with zero payments, a synthetic gentle ramp draws on the chart so it never looks dead — but the cards stay at `—` to signal "no real data yet."

---

## Depositing SOL

Click **Deposit** in the page header. A modal opens; enter an amount (capped at 10 SOL on devnet), sign with your wallet, and the SOL transfers on-chain to the HiveMind treasury recipient pubkey (`VITE_HM_TREASURY_PUBKEY`, default is the funder pubkey).

The full flow is documented in [Treasury Deposits →](./guides/treasury-deposit).

---

## How a Mission Actually Spends

When a mission is launched with sufficient devnet SOL, the frontend bundles two on-chain instructions into a single transaction:

1. `create_mission(mission_id)` — creates the mission PDA owned by the caller
2. `fund_mission(lamports)` — transfers SOL into the PDA; `escrow_lamports += lamports`

The full mission budget — every cent of it — lands in the PDA. The four sliders on the Mission Create page (Agent Compute, Token Usage, Escrow Reserve, Settlement Buffer) are an *internal accounting split* of how the swarm will spend from that pool. They don't move SOL anywhere different on-chain.

When the mission completes, the owner can call `settle_mission(lamports, recipient)` to release escrow back to themselves or to agent recipient pubkeys. The MVP doesn't auto-fire settlement on every completion — the on-chain plumbing is there, but the trigger is manual.

---

## Follow-up Payments

After a mission settles, the original escrow is empty. If you want to keep chatting with the swarm to make changes, HiveMind gives you **5 free follow-up messages** per mission. Past that, each additional message requires a small on-chain top-up — currently **0.05 SOL** — via the same `SystemProgram.transfer` rail used by Treasury deposits.

Every follow-up payment also shows up in the cashflow chart and the transaction feed. See [Follow-up Paywall →](./guides/follow-up-paywall) for the full UX.

---

## API: Payments

```typescript
// List all payments (optionally filtered by mission)
GET /api/payments?missionId=M-247

// Response
{
  "payments": [
    {
      "id": "pay-1042",
      "missionId": "M-247",
      "amountSol": 0.36,
      "recipientPubkey": "G4o8wSS85JzcpDqTN9RWKaUvFF2a3bT3x2yewyk4xWPc",
      "status": "confirmed",
      "createdAt": "2026-05-10T16:38:50Z"
    }
  ]
}
```

```typescript
// Record a payment intent (used by the Deposit button and follow-up paywall)
POST /api/payments/intent
Authorization: Bearer <hm_jwt>

{
  "missionId": "M-247",
  "amountSol": 0.1,
  "recipientPubkey": "G4o8wSS85JzcpDqTN9RWKaUvFF2a3bT3x2yewyk4xWPc"
}
```

The intent endpoint is **bookkeeping only** — the actual SOL transfer must already have been signed by the wallet and confirmed on-chain. HiveMind records the intent so the payment shows up in the Treasury feed.

---

## Recipient Pubkey

The default treasury recipient is the HiveMind funder pubkey on devnet:

```
G4o8wSS85JzcpDqTN9RWKaUvFF2a3bT3x2yewyk4xWPc
```

Override with the `VITE_HM_TREASURY_PUBKEY` env var on the frontend. The Treasury page, Deposit modal, and follow-up paywall all read the same constant — change it once and every entry point updates.

---

## Next

- **[Deposit Guide →](./guides/treasury-deposit)** — step-by-step deposit walkthrough
- **[Follow-up Paywall →](./guides/follow-up-paywall)** — paying for extra changes
- **[On-Chain Settlement →](./guides/on-chain-settlement)** — escrow lifecycle
- **[Contracts →](./contracts)** — Anchor program reference
