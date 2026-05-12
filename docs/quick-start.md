---
id: quick-start
title: Quick Start
sidebar_position: 2
---

# Quick Start

Two paths:

1. **Use the hosted devnet build** — open the deployed app, connect a Solflare or Phantom wallet on Solana devnet, and launch a mission. No setup. Best for evaluating the product.
2. **Run locally** — clone the four repos and run the full stack on your machine. Best for building on top of HiveMind.

---

## Path 1: Use the Hosted Devnet Build

| Step | Action |
|---|---|
| 1 | Open the live URL (linked from the [landing page](https://github.com/HiveMind-Orgnanization)) |
| 2 | Switch your wallet (Solflare or Phantom) to **Devnet** |
| 3 | Click **Connect Wallet** in the top-right |
| 4 | Sign the auth message (free, no SOL spent — this issues your session JWT) |
| 5 | Activate your free trial banner if prompted (sponsored by the HiveMind funder wallet) |
| 6 | Hit **Launch Mission** → type a one-sentence objective → pick agents → launch |

You'll need a small amount of devnet SOL (~0.1) for any optional on-chain interactions like Treasury deposits or follow-up payments. Get it with:

```bash
solana airdrop 1 <your-wallet-address> --url devnet
```

---

## Path 2: Run Locally

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm i -g pnpm` |
| PostgreSQL | 14+ | Neon, Supabase, or local |
| Solflare or Phantom | latest | Browser extension wallet |
| OpenAI API key | — | Required — backend routes all agent calls through OpenAI |

The Solana CLI is only needed if you want to deploy your own copy of the Anchor program; for normal use, the existing devnet program is sufficient.

### 1. Clone the Repos

The project is split across four repos under the [HiveMind-Orgnanization](https://github.com/HiveMind-Orgnanization) GitHub org:

```bash
mkdir hivemind && cd hivemind
git clone https://github.com/HiveMind-Orgnanization/HiveMind-Frontend.git hivemind-frontend
git clone https://github.com/HiveMind-Orgnanization/HiveMind-Backend.git hivemind-backend
git clone https://github.com/HiveMind-Orgnanization/hivemind-contracts.git
git clone https://github.com/HiveMind-Orgnanization/hivemind-docs.git
```

### 2. Backend Configuration

```bash
cd hivemind-backend
cp .env.example .env
```

Edit `.env`:

```bash
# Database — Neon URL or any PostgreSQL connection string
DATABASE_URL=postgres://user:password@host:5432/hivemind

# Models — at minimum, OPENAI_API_KEY is required. The other model ids
# in the UI dropdown are surfaced for the multi-vendor story; the
# backend currently routes all calls through OPENAI_MODEL_ALL.
OPENAI_API_KEY=sk-...
OPENAI_MODEL_ALL=gpt-5.5
OPENAI_MODEL=gpt-5.5
OPENAI_MODEL_HEAVY=gpt-5.5
OPENAI_MODEL_CRIT=gpt-5.5

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om

# Funder keypair — pays for free-trial registration on behalf of new
# wallets. Optional locally; if missing, the free-trial flow will fail
# but everything else works.
FUNDER_SECRET_KEY=<base58-secret-or-byte-array-json>

# Auth
JWT_SECRET=<generate-a-random-64-char-string>

# Swarm tuning
SWARM_BUILD_REPAIR_MAX_ROUNDS=6

# Port
PORT=8787
```

Install and run:

```bash
npm install
npm run dev
```

You should see the server bind on `http://localhost:8787`.

### 3. Frontend Configuration

```bash
cd ../hivemind-frontend
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_API_URL=http://localhost:8787
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Optional: override the treasury recipient pubkey used by the Deposit
# button and the follow-up paywall. Defaults to the deployer's funder
# pubkey on devnet.
VITE_HM_TREASURY_PUBKEY=<your-pubkey>
```

Install and run:

```bash
pnpm install
pnpm dev
```

Open **http://localhost:5173**.

### 4. Connect Your Wallet

1. Switch Solflare / Phantom to **Devnet** (Settings → Developer Settings → Devnet)
2. Get devnet SOL: `solana airdrop 1 <your-wallet> --url devnet`
3. Click **Connect Wallet** in the app top-right
4. Approve the sign-in message — this creates your API session (JWT stored in `localStorage` as `hm_jwt`)

:::tip Free Trial
New wallets can have their on-chain free trial sponsored by the HiveMind funder wallet (if `FUNDER_SECRET_KEY` is configured). The trial registers your wallet on the protocol's free-trial PDA so you can launch missions without paying.
:::

### 5. Launch Your First Mission

1. Click **New Mission** in the sidebar (or navigate to `/missions/new`)
2. Type your objective. Example:
   ```
   Build a Solana NFT minting landing page — hero, gallery, mint button.
   ```
3. Pick agents (the default roster for `high` priority is Strategy, Research, Design, Development, Marketing, Treasury, Coordination)
4. Optionally override per-agent models (see [Choosing Models →](./guides/choosing-models))
5. Set budget (default 6 SOL; 10 SOL is the hard cap)
6. Click **Launch Mission**

Watch agents execute in the **Agent Workspace** (`/agents`). When the preview is bundleable, the right pane will switch from *"Building your preview…"* to the live Sandpack iframe.

---

## Verifying Everything Works

### Health Check

```bash
curl http://localhost:8787/api/health
```

### WebSocket Test

```bash
wscat -c ws://localhost:8787/ws
> {"action":"subscribe","channel":"global"}
```

### On-Chain Program

```bash
solana account EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om --url devnet
```

---

## Common Issues

### "API offline" badge in the top nav

The frontend can't reach the backend. Check:
- Backend is running on port 8787
- `VITE_API_URL` matches the backend address
- No CORS errors in DevTools

### Wallet sign-in fails

- Ensure you're on **Devnet** in the wallet extension
- Try disconnecting and reconnecting
- Clear `localStorage` if a stale `hm_jwt` is lingering: `localStorage.clear()`

### Preview stuck on "Building your preview…"

- Wait for Development agent to produce `frontend/package.json` and an entry file (`App.tsx` / `main.tsx`) — the preview releases the moment both exist
- If Development finished and it's still stuck, refresh the page; the artifact tree is re-evaluated on mount

### Mission completion stuck

- Check the swarm timeout — it defaults to ~20 minutes
- Some non-code agents (Marketing, Treasury, Coordination) write only markdown; their slowness doesn't block the preview but does delay the *"completed"* status

### Treasury deposit fails with "Insufficient funds"

- Your wallet needs more than 0.1 SOL on devnet
- Airdrop more: `solana airdrop 1 <wallet> --url devnet`

---

## Next Steps

- **[Architecture →](./architecture)** — understand the full system
- **[Your First Mission →](./guides/first-mission)** — detailed walkthrough
- **[Choosing Models →](./guides/choosing-models)** — per-agent model selection
- **[Live Preview →](./guides/live-preview)** — Sandpack + self-healing
- **[Treasury Deposits →](./guides/treasury-deposit)** — depositing SOL on-chain
- **[API Reference →](./api-reference)** — integrate HiveMind into your app
