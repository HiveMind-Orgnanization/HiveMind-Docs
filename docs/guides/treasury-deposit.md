---
id: treasury-deposit
title: Treasury Deposits
sidebar_position: 6
---

# Treasury Deposits

The **Deposit** button on the Treasury page lets you move SOL on-chain into the HiveMind treasury recipient wallet. This is the same rail used to fund missions and pay for follow-up messages — every deposit is a real Solana `SystemProgram.transfer` on devnet, signed by your wallet, and recorded as a payment intent on the backend.

---

## When to Deposit

You typically don't need to "deposit" before launching a mission — the mission's own escrow is funded directly when you click Launch (the frontend bundles `create_mission` + `fund_mission` into one transaction).

Use the Treasury Deposit button when you want to:

- **Pre-fund** for upcoming follow-up messages (5 free, then 0.05 SOL each)
- **Top up** the platform balance for demos
- **Verify on-chain plumbing** — every deposit produces a real transaction signature you can look up on the Solana Explorer

---

## Step-by-Step

### 1. Navigate to Treasury

Open `/treasury` from the sidebar or from the landing page footer link.

### 2. Click Deposit

The button is in the page header next to the live SLOT pill. It's disabled if your wallet isn't connected — connect first.

### 3. Enter an Amount

The modal shows your wallet pubkey, the recipient pubkey, and the network (devnet). Type an amount in the SOL field, or use one of the preset chips (`0.1`, `0.5`, `1`, `2` SOL).

**Cap:** 10 SOL per deposit. The modal will error if you exceed it.

### 4. Click "Sign & deposit"

Your wallet (Solflare / Phantom) pops up. Review the transaction:

- **From:** your connected wallet
- **To:** `G4o8wSS85JzcpDqTN9RWKaUvFF2a3bT3x2yewyk4xWPc` (default treasury recipient)
- **Amount:** the SOL you entered, converted to lamports
- **Network:** devnet

Click Approve.

### 5. Wait for Confirmation

The modal shows "Confirming…" while the transaction is processed. A toast announces *"Deposit signed"* immediately, then *"Deposit confirmed"* once the slot finalizes (usually under a second on devnet).

### 6. Verify on Solana Explorer

The deposit appears in the Treasury page's transaction feed within a few seconds. You can also verify on a Solana Explorer:

```
https://explorer.solana.com/address/<your-wallet-pubkey>?cluster=devnet
```

The new transaction lands at the top of your wallet's transaction history.

---

## What Happens Under the Hood

The frontend builds a single-instruction transaction:

```typescript
const tx = new Transaction({
  feePayer: walletPubkey,
  recentBlockhash: blockhash,
}).add(
  SystemProgram.transfer({
    fromPubkey: walletPubkey,
    toPubkey: TREASURY_RECIPIENT_PUBKEY,
    lamports: amountSol * LAMPORTS_PER_SOL,
  }),
);

const sig = await wallet.sendTransaction(tx, connection);
await connection.confirmTransaction(
  { signature: sig, blockhash, lastValidBlockHeight },
  "confirmed",
);
```

Once confirmed, the frontend records a payment intent on the backend:

```typescript
POST /api/payments/intent
{
  missionId: missions[0]?.id ?? "platform-deposit",
  amountSol: amount,
  recipientPubkey: TREASURY_RECIPIENT_PUBKEY,
}
```

This intent appears in the Treasury cashflow chart (counted as **inflow**, since the recipient matches `VITE_HM_TREASURY_PUBKEY`) and in the transaction feed.

---

## Recipient Pubkey

The recipient defaults to the HiveMind funder pubkey on devnet:

```
G4o8wSS85JzcpDqTN9RWKaUvFF2a3bT3x2yewyk4xWPc
```

Override it for your own deployment by setting `VITE_HM_TREASURY_PUBKEY` in `.env.local` before building the frontend. The Deposit modal, follow-up paywall, and Treasury page all read the same constant.

---

## Common Issues

### "Insufficient funds for transaction"
Your wallet doesn't have enough devnet SOL. Airdrop more:

```bash
solana airdrop 1 <your-wallet> --url devnet
```

### "Connect your wallet first"
The Deposit button is disabled until a wallet is connected. Click the wallet pill in the top-right.

### Wallet popup never appears
Your browser may have blocked the wallet extension popup. Allow popups for the HiveMind domain, then retry.

### "Devnet cap: 10 SOL per deposit"
You entered more than 10 SOL. Lower the amount and retry.

### Toast says "Payment cancelled"
You rejected the signature in your wallet. No SOL was moved, no payment intent was recorded.

---

## Next

- **[Follow-up Paywall →](./follow-up-paywall)** — what the deposit funds
- **[Treasury →](../treasury)** — bucket math and cashflow
- **[On-Chain Settlement →](./on-chain-settlement)** — escrow lifecycle
