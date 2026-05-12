---
id: intro
title: Introduction
sidebar_position: 1
---

# HiveMind Protocol

> **Hire an AI Workforce. Not Just an Assistant.**

HiveMind is an autonomous AI agent orchestration protocol on Solana. Type one sentence describing what you want built — *"Build a Solana NFT minting page," "Research a DeFi competitor," "Design a pitch deck"* — and a swarm of nine specialized agents collaborates to ship it end-to-end. Each agent picks its own model. Their work is funded by an on-chain escrow PDA, and when their code breaks the preview, another agent self-heals it.

---

## What Makes HiveMind Different

Most agent products give you one model with many tools. HiveMind gives you **nine specialists with tight contracts** — each agent has one job, one model picked for that job, and a deliverable contract it has to satisfy.

| Specialist | Job | Headline Model |
|---|---|---|
| **Strategy** | Architecture and protocol decisions | GPT-4o |
| **Research** | Market validation, competitor analysis | DeepSeek v3 |
| **Design** | UI specs, layouts, brand language | GPT-4.1 |
| **Development** | Production-ready code (the only role that edits files) | Llama 4 70B |
| **Marketing** | Go-to-market plan, copy | Llama 4 70B |
| **Treasury** | Budget allocation, on-chain escrow controls | Mixtral 8x22B |
| **Analytics** | Metrics, projections, KPIs | DeepSeek v3 |
| **Coordination** | Cross-agent handoffs, dependency tracking | GPT-4.1 |
| **Memory** | Persistent context across sessions | GPT-4o mini |

You can override the model for any agent at mission-creation time — see [Choosing Models →](./guides/choosing-models).

---

## Core Concepts in 60 Seconds

| Concept | What It Is |
|---|---|
| **Mission** | A goal with a budget, deadline, and agent roster — the unit of work |
| **Agent** | A specialized AI worker with a fixed role contract |
| **Escrow PDA** | An on-chain program-owned account that holds the mission's SOL |
| **Settlement** | Releasing escrow funds back to the user (or to agent recipients) when a mission completes |
| **Self-Healing Preview** | When a generated app crashes, an agent detects the trace and patches the code |
| **Follow-up Paywall** | After settlement, users get 5 free follow-up messages, then 0.05 SOL per message |
| **HIVE Token** | An SPL token used internally for trial credits and (future) premium model gating |

---

## How a Mission Works

```
You write: "Build a Solana NFT minting landing page —
            hero, gallery, mint button."
            Budget: 6 SOL · Agents: Strategy, Research, Design,
            Development, Marketing, Treasury, Coordination

HiveMind:
  1. Strategy     → protocol type, architecture decisions
  2. Research     → competitor pages, conventions, must-haves
  3. Design       → UI spec, color system, component list
  4. Development  → writes the full Vite + React + Tailwind app
  5. Coordination → handoff context, dependency check
  6. Marketing    → headline, social copy, hero CTA
  7. Treasury     → budget split, on-chain escrow controls

  → Working app rendered in Sandpack preview
  → Self-heal loop: if preview throws a runtime error,
    an agent reads the trace and patches it in-chat
  → Mission status flips to "completed"
  → User can send 5 free follow-up messages, then pay
    per-message on-chain to keep iterating
```

Total time: ~3–5 minutes depending on mission complexity.

---

## Who Is HiveMind For?

### Solo Founders
"Build the MVP" workflow without a full team — type the spec, get a hostable app.

### Crypto Operators
Automate treasury ops, research, and on-chain settlement against a verifiable budget.

### DAO Coordinators
Pay contributor agents transparently with on-chain receipts for every payout.

### Developers
Integrate the HiveMind API into your own product, or fork the protocol on-chain.

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
│  Vite + React + TypeScript · Tailwind · motion/react    │
│  Sandpack (live preview) · Solana wallet-adapter        │
│  Deployed: Vercel                                        │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────┐
│                       Backend                            │
│  Fastify 5 + TypeScript · OpenAI SDK · ws · zod         │
│  Custom multi-agent orchestration (no LangGraph/CrewAI) │
│  Neon Postgres · JWT wallet-signature auth              │
│  Deployed: AWS Elastic Beanstalk (ap-south-1)           │
└────────────────────────┬────────────────────────────────┘
                         │ Anchor CPI
┌────────────────────────▼────────────────────────────────┐
│                Solana On-Chain Layer                     │
│  Anchor 0.30 · Rust · Devnet                            │
│  Mission PDAs · fund / settle escrow                    │
│  Agent reputation · HIVE SPL token · free-trial system  │
│  Program: EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om  │
└─────────────────────────────────────────────────────────┘
```

**Models routed today:** OpenAI GPT-5.5 (primary), with UI-level selection across Claude 4.7 Sonnet/Opus, Llama 4 70B/405B, Mixtral 8x22B, DeepSeek v3, and Gemini 2.5 Pro.

---

## Status

| | |
|---|---|
| Phase | Devnet · Colosseum Hackathon (May 2026) |
| Demo | [youtube.com/watch?v=5d9067mHfPE](https://www.youtube.com/watch?v=5d9067mHfPE) |
| Source | [github.com/HiveMind-Orgnanization](https://github.com/HiveMind-Orgnanization) |
| Twitter | [@Jagadeeeshftw](https://x.com/Jagadeeeshftw) |

---

## Quick Navigation

- **[Quick Start →](./quick-start)** — running locally in 5 minutes
- **[Architecture →](./architecture)** — full system design
- **[Agent Types →](./agents/overview)** — what each agent does
- **[Missions →](./missions)** — create and manage missions
- **[Treasury →](./treasury)** — on-chain escrow and deposits
- **[API Reference →](./api-reference)** — REST + WebSocket docs

### Guides

- **[Your First Mission →](./guides/first-mission)**
- **[Choosing Models →](./guides/choosing-models)** — per-agent model selection
- **[Live Preview & Self-Healing →](./guides/live-preview)** — how the swarm fixes its own bugs
- **[Treasury Deposits →](./guides/treasury-deposit)** — putting SOL on-chain
- **[Follow-up Paywall →](./guides/follow-up-paywall)** — what happens after a mission settles
- **[On-Chain Settlement →](./guides/on-chain-settlement)** — escrow lifecycle
