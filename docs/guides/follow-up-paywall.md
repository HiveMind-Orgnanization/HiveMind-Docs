---
id: follow-up-paywall
title: Follow-up Paywall
sidebar_position: 7
---

# Follow-up Paywall

When a mission settles, the original escrow has been spent — but users frequently want to ask the swarm for one more tweak ("make the hero button bigger," "add a FAQ section," "swap the color palette"). HiveMind gives every settled mission **5 free follow-up messages**, then charges **0.05 SOL on-chain** per additional message.

This page explains the UX, the math, and the on-chain flow.

---

## States

After a mission flips to `status === "completed"`, the chat composer in the Agent Workspace adds a banner above the input:

| State | Banner shows | Action on Send |
|---|---|---|
| `freeFollowupsRemaining > 0` | *"N of 5 free follow-up messages remaining."* (white/55 tone) | Sends free, increments counter |
| `freeFollowupsRemaining === 0` | *"Free follow-ups used. Each additional message costs 0.05 SOL on devnet."* (amber tone, with a Top-up button) | Pops the paywall modal |

Both states only appear when the mission is `completed`. While the mission is `active` or `paused`, the composer behaves normally.

---

## Free Quota

Defined in `src/app/store.ts`:

```typescript
export const FOLLOWUP_FREE_QUOTA = 5;
export const FOLLOWUP_PAID_SOL = 0.05;
```

The counter `mission.followUpCount` lives on the mission record. It increments on every send while the mission is `completed`. Once it hits 5, the paywall arms.

---

## Paying for a Follow-up

When the user tries to send the 6th message (or clicks the **Top up** button in the banner), a modal appears with:

- **From:** your wallet pubkey (truncated)
- **To:** HiveMind treasury recipient pubkey (`VITE_HM_TREASURY_PUBKEY`)
- **Network:** devnet
- **Amount:** 0.05 SOL

Click **Pay 0.05 SOL & continue**. Your wallet pops up; sign the transaction. On confirmation:

1. The modal closes
2. A toast announces *"Payment confirmed"*
3. One credit is refunded (`followUpCount -= 1`) so the *next* send goes through without re-prompting
4. The user's pending message is ready to send

The next message **after** that one will re-arm the paywall, so spend is always explicit. We don't sell credit packs — every paid message is a separate signature.

---

## On-Chain Flow

The paywall uses the same `SystemProgram.transfer` rail as the Treasury Deposit button:

```typescript
const tx = new Transaction({
  feePayer: walletPubkey,
  recentBlockhash: blockhash,
}).add(
  SystemProgram.transfer({
    fromPubkey: walletPubkey,
    toPubkey: FOLLOWUP_RECIPIENT_PUBKEY, // same as Treasury default
    lamports: 0.05 * LAMPORTS_PER_SOL,
  }),
);

const sig = await wallet.sendTransaction(tx, connection);
await connection.confirmTransaction(
  { signature: sig, blockhash, lastValidBlockHeight },
  "confirmed",
);
```

The signature lands on devnet in under a second. The payment is then recorded server-side via `POST /api/payments/intent` so it appears in the Treasury cashflow chart and transaction feed.

---

## Why It's Per-Message, Not a Subscription

Three reasons:

1. **Honest economics.** The user pays exactly for the agent work they trigger. No "you have 10 chat credits left" surface.
2. **Easier on-chain auditing.** Every paid action is its own signature, traceable on Solana Explorer.
3. **Better demo.** "Watch — every message is a real Solana transaction" hits harder than "let me buy a credit pack and chat against an off-chain balance."

The follow-up rail is the same rail as Treasury deposits, agent payouts, and mission escrow funding. One on-chain settlement system, used everywhere.

---

## Resetting the Counter

The follow-up counter is per-mission. It resets when:

- The mission is deleted and re-created
- The user starts a new mission

There's no UI to manually reset within a single mission. By design — *the whole point* is that users feel the economic cost of asking for "just one more change."

---

## What If My Wallet Has No Devnet SOL?

The paywall fails with `"Insufficient funds"` and the modal stays open. Airdrop more:

```bash
solana airdrop 1 <your-wallet> --url devnet
```

Then retry the paywall.

---

## Disabling the Paywall (Development)

If you're running locally and want to disable the paywall for testing, edit `src/app/store.ts`:

```typescript
export const FOLLOWUP_FREE_QUOTA = 999999;  // effectively unlimited
```

Don't ship this change to production — the paywall is a load-bearing economic primitive.

---

## Common Issues

### "Connect your wallet to continue."
You disconnected the wallet after the mission settled. Reconnect and retry.

### Paywall fires after every message
You're re-rendering the workspace with `followUpCount` not persisting. Check that `patchLocal(mission.id, ...)` is actually updating the mission in `localStorage` and the backend.

### Counter shows wrong remaining number
Each settled mission has its own counter. Switching between missions in the Dashboard switches the counter you see in the workspace.

---

## Next

- **[Treasury Deposits →](./treasury-deposit)** — same rail, different entry point
- **[Treasury →](../treasury)** — bucket math and cashflow
- **[Missions →](../missions)** — full mission lifecycle
