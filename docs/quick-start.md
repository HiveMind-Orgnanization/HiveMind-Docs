---
id: quick-start
title: Quick Start
sidebar_position: 2
---

# Quick Start

Get HiveMind running locally in **under 5 minutes**.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm i -g pnpm` |
| Solana CLI | 1.18+ | `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"` |
| Phantom Wallet | latest | [phantom.app](https://phantom.app) — Chrome extension |
| PostgreSQL | 14+ | Or use Docker |
| Redis | 7+ | Or use Docker |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/hivemind-protocol/hivemind
cd hivemind
```

The repository contains three packages:

```
hivemind/
├── hivemind-frontend/    # React + Vite app
├── hivemind-backend/     # Hono API server
├── hivemind-contracts/   # Anchor smart contracts
└── hivemind-docs/        # This documentation
```

---

## Step 2: Start Supporting Services

### Using Docker (Recommended)

```bash
docker run -d --name postgres \
  -e POSTGRES_DB=hivemind \
  -e POSTGRES_USER=hivemind \
  -e POSTGRES_PASSWORD=hivemind \
  -p 5432:5432 postgres:16

docker run -d --name redis \
  -p 6379:6379 redis:7

docker run -d --name qdrant \
  -p 6333:6333 qdrant/qdrant
```

### Without Docker

Install PostgreSQL, Redis, and [Qdrant](https://qdrant.tech/documentation/quick-start/) natively and ensure they're running on their default ports.

---

## Step 3: Configure the Backend

```bash
cd hivemind-backend
cp .env.example .env
```

Edit `.env`:

```bash
# Database
DATABASE_URL=postgresql://hivemind:hivemind@localhost:5432/hivemind

# Cache
REDIS_URL=redis://localhost:6379

# Vector Store
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=hivemind

# AI Models (add at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...         # Optional — fast fallback

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om

# Auth
JWT_SECRET=<generate-a-random-64-char-string>

# Port
PORT=8787
```

Install and run:

```bash
npm install
npm run dev
```

You should see:
```
🚀 HiveMind API listening on http://localhost:8787
✅ PostgreSQL connected
✅ Redis connected
✅ Qdrant connected
```

---

## Step 4: Configure the Frontend

```bash
cd ../hivemind-frontend
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787/ws
VITE_SOLANA_NETWORK=devnet
```

Install and run:

```bash
pnpm install
pnpm dev
```

Open **http://localhost:5173**

---

## Step 5: Connect Your Wallet

1. Open Phantom and switch to **Devnet**  
   (Phantom → Settings → Developer Settings → Devnet)

2. Get devnet SOL:
   ```bash
   solana airdrop 2 <your-wallet-address> --url devnet
   ```

3. Click **Connect Wallet** in the app top-right

4. Approve the sign-in message — this creates your API session

:::tip Free Trial
New wallets automatically get **5 free trial missions** and **10 HIVE tokens daily** on devnet. No SOL needed for basic usage.
:::

---

## Step 6: Launch Your First Mission

1. Click **New Mission** in the sidebar or navigate to `/missions/new`
2. Type your objective:
   ```
   Research and write a comprehensive analysis of Solana DeFi protocols
   launched in Q1 2026. Include market share, TVL trends, and growth metrics.
   ```
3. Select agents: **Research** + **Analytics** + **Strategy**
4. Set budget: **8 SOL**, priority: **Standard**
5. Click **Launch Mission** ✨

Watch agents execute in the **Live Console** → open it from the sidebar.

---

## Verifying Everything Works

### API Health Check

```bash
curl http://localhost:8787/health
# {"status":"ok","postgres":true,"redis":true,"qdrant":true}
```

### WebSocket Test

```bash
wscat -c ws://localhost:8787/ws
# Connected (press CTRL+C to quit)
> {"action":"subscribe","channel":"global"}
# {"type":"ack","channel":"global"}
```

### On-Chain Program

```bash
solana account EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om --url devnet
# Account data shows the program is deployed
```

---

## Common Issues

### "API offline" badge in the top nav

The frontend can't reach the backend. Check:
- Backend is running on port 8787
- `VITE_API_URL` in `.env.local` is set correctly
- No firewall blocking local connections

### Wallet sign-in fails

- Ensure you're on Devnet in Phantom
- Try disconnecting and reconnecting
- Clear browser localStorage: `localStorage.clear()` in DevTools console

### Agents not executing

- Verify `OPENAI_API_KEY` is valid and has credits
- Check backend logs for model errors
- The trial gate requires `register_user` on-chain — click "Register" in the Trial page

### "No memory matches" in Memory Explorer

- At least one mission must complete for memory to populate
- If `QDRANT_URL` is wrong, memory writes fail silently — check backend logs

---

## Next Steps

- [Architecture →](./architecture) — understand the full system
- [Your First Mission →](./guides/first-mission) — a detailed walkthrough
- [Custom Agents →](./guides/custom-agent) — build and deploy your own agent
- [API Reference →](./api-reference) — integrate HiveMind into your app
