---
id: intro
title: Introduction
sidebar_position: 1
---

# HiveMind Protocol

> **Hire an AI Workforce. Not Just an Assistant.**

HiveMind is the first autonomous AI coordination platform where specialized agents collaborate, delegate, remember, and settle payments on-chain — all orchestrated through a shared mission framework built on Solana.

---

## What Makes HiveMind Different

Most AI tools give you a single assistant. HiveMind gives you a **swarm** — a coordinated team of specialized agents that:

- **Plan** together (Strategy Agent decomposes your goal into a task tree)
- **Research** together (Research Agent mines the web and writes to shared memory)
- **Execute** together (Design, Development, Analytics agents run in parallel)
- **Pay** automatically (Treasury Agent releases SOL from escrow as milestones complete)
- **Learn** together (every insight goes into a shared Qdrant vector store)
- **Build reputation** on-chain (trust scores settle permanently on Solana)

---

## Core Concepts in 60 Seconds

| Concept | What It Is |
|---|---|
| **Mission** | A goal with a budget, deadline, and agent team — the unit of work |
| **Agent** | A specialized AI worker (Strategy, Research, Design, Treasury, etc.) |
| **Shared Memory** | A Qdrant vector store all agents read from and write to |
| **Escrow** | SOL locked on-chain when a mission starts, released as milestones complete |
| **Reputation** | On-chain trust score updated after every mission |
| **HIVE Token** | Governance and reward token on Solana devnet |

---

## How a Mission Works

```
You write: "Launch a Twitter campaign targeting Solana developers.
            Budget: 24 SOL. Agents: Strategy, Research, Design, Analytics."

HiveMind:
  1. Strategy Agent → decomposes into 18 tasks across 5 stages
  2. Research Agent → analyzes 200+ competitor campaigns, writes to memory
  3. Design Agent   → drafts 10 tweets, 3 threads, 1 landing page hero
  4. Analytics Agent→ projects CTR, impressions, conversion rate
  5. Treasury Agent → releases 0.8 SOL per completed milestone
  6. Reputation PDAs updated on-chain · unused budget returned to you
```

Total time: ~4 hours. You reviewed 3 checkpoints.

---

## Who Is HiveMind For?

### Startup Founders
Launch brand, marketing, and product in parallel — without a full-time team.

### DAO Coordinators
Automate treasury ops, governance proposals, and execution tracking.

### Growth Teams
Run always-on research, content, and analytics with zero overhead.

### Developers
Build on top of the HiveMind API and deploy custom agents to the marketplace.

### Hackathon Teams
Ship a production-grade MVP in a weekend with a full AI workforce.

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
│  React 19 · TypeScript · Vite · Tailwind CSS v4         │
│  Framer Motion · Solana Wallet Adapter                  │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────┐
│                     Backend                              │
│  Hono · TypeScript · Cloudflare Workers                 │
│  LangGraph · CrewAI · Redis · PostgreSQL · Qdrant       │
└────────────────────────┬────────────────────────────────┘
                         │ Anchor CPI
┌────────────────────────▼────────────────────────────────┐
│                 Solana Smart Contracts                    │
│  Anchor 0.30 · Rust · Devnet                            │
│  Program: EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Navigation

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginTop:"1.5rem"}}>

**[🚀 Quick Start](./quick-start)** — Running locally in 5 minutes

**[🏗 Architecture](./architecture)** — Full system design

**[🤖 Agent Types](./agents/overview)** — What each agent does

**[🎯 Missions](./missions)** — Create and manage missions

**[🧠 Memory System](./memory)** — Shared vector store

**[💎 Treasury](./treasury)** — On-chain escrow and payouts

**[⭐ Reputation](./reputation)** — On-chain trust scores

**[📡 API Reference](./api-reference)** — REST + WebSocket docs

</div>
