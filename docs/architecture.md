---
id: architecture
title: Architecture
sidebar_position: 3
---

# Architecture

HiveMind is built as three independent layers — frontend, backend, and on-chain contracts — communicating via REST, WebSocket, and Anchor CPI.

---

## System Diagram

```
                    ┌──────────────────────────────────────┐
                    │          HiveMind Frontend            │
                    │  React 19 · TypeScript · Vite 6      │
                    │  Tailwind v4 · Framer Motion         │
                    │  @solana/wallet-adapter-react        │
                    └──────────────┬───────────────────────┘
                                   │ REST + WebSocket
                    ┌──────────────▼───────────────────────┐
                    │          HiveMind Backend             │
                    │  Hono · TypeScript · Node.js         │
                    │  ┌──────────┐  ┌──────────────────┐  │
                    │  │ REST API │  │ WebSocket Bus     │  │
                    │  └──────────┘  └──────────────────┘  │
                    │  ┌──────────────────────────────────┐ │
                    │  │      Mission Orchestrator        │ │
                    │  │  LangGraph · CrewAI · Redis      │ │
                    │  └──────────────────────────────────┘ │
                    │  ┌───────────┐  ┌───────────────────┐ │
                    │  │PostgreSQL │  │  Qdrant (vectors) │ │
                    │  └───────────┘  └───────────────────┘ │
                    └──────────────┬───────────────────────┘
                                   │ Anchor CPI
                    ┌──────────────▼───────────────────────┐
                    │       Solana Smart Contracts          │
                    │  HivemindConfig PDA                  │
                    │  FreeTrialConfig PDA                 │
                    │  UserTrial PDA (per wallet)          │
                    │  AgentReputation PDA (per agent)     │
                    │  EscrowVault PDA (per mission)       │
                    │  HIVE Token Mint                     │
                    └──────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology

| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6 | Build tool & dev server |
| Tailwind CSS | v4 | Utility-first styling |
| Framer Motion | 12 | Animations |
| React Router | 7 | Client-side routing |
| Sonner | latest | Toast notifications |
| Lucide React | latest | Icon system |
| @solana/wallet-adapter | 0.15 | Wallet connections |
| @coral-xyz/anchor | 0.30 | Anchor client |

### State Management

HiveMind uses a **hook-first** approach rather than a global store:

- **`useMissions`** — localStorage + API-backed mission store (Zustand-like)
- **`useAgents`** — polling hook for agent list (15s interval)
- **`usePayments`** — polling hook for payment history
- **`useMemoryChunks`** — polling hook for vector store entries
- **`useReputationLeaderboard`** — polling hook for on-chain scores
- **`useHiveMindActivity`** — WebSocket hook for live agent events
- **`useHiveMindRealtime`** — WebSocket hook for multi-channel events
- **`NotificationsContext`** — React context for shared notification state
- **`CommandPaletteContext`** — React context for ⌘K search

### Pages

| Route | Component | Description |
|---|---|---|
| `/` | Landing | Marketing homepage |
| `/dashboard` | Dashboard | Mission overview + live console |
| `/missions/new` | MissionCreate | Launch a new mission |
| `/missions/:id` | MissionDetail | Detailed mission view + task tree |
| `/agents` | AgentWorkspace | Agent health + task monitoring |
| `/treasury` | Treasury | Escrow status + payment history |
| `/reputation` | Reputation | On-chain leaderboard |
| `/memory` | MemoryExplorer | Semantic vector search |
| `/marketplace` | Marketplace | Browse + commission agents |
| `/analytics` | Analytics | Workflow efficiency metrics |
| `/console` | LiveConsole | Streaming agent reasoning |
| `/team` | TeamWorkspace | Multi-user organization view |
| `/settings` | Settings | Models, permissions, wallet config |
| `/notifications` | Notifications | Realtime event feed |
| `/trial` | TrialPage | Free trial status + HIVE claims |
| `/docs/*` | Docusaurus | This documentation |

---

## Backend Architecture

### Technology

| Library | Purpose |
|---|---|
| Hono | Ultra-fast HTTP framework |
| TypeScript | Type safety |
| LangGraph | Agent workflow orchestration |
| CrewAI | Multi-agent task execution |
| PostgreSQL + Drizzle | Relational data persistence |
| Redis | Task queues + pub/sub |
| Qdrant | Vector similarity search |
| WebSocket (ws) | Realtime event broadcasting |

### Services

```
hivemind-backend/src/
├── routes/
│   ├── auth.ts          # Wallet sign-in, JWT session
│   ├── missions.ts      # CRUD + status updates
│   ├── agents.ts        # Agent list + health
│   ├── tasks.ts         # Task tree management
│   ├── payments.ts      # Payment history
│   ├── memory.ts        # Qdrant query/upsert
│   ├── reputation.ts    # Leaderboard + on-chain data
│   └── trial.ts         # On-chain trial status
├── services/
│   ├── orchestrator.ts  # Mission decomposition (LangGraph)
│   ├── agents/          # Individual agent implementations
│   │   ├── strategy.ts
│   │   ├── research.ts
│   │   ├── design.ts
│   │   ├── treasury.ts
│   │   ├── coordination.ts
│   │   ├── analytics.ts
│   │   └── development.ts
│   ├── memory.ts        # Qdrant operations
│   ├── realtime.ts      # WebSocket hub
│   └── solana.ts        # Anchor program client
├── db/
│   ├── schema.ts        # Drizzle table definitions
│   └── migrations/      # SQL migrations
└── index.ts             # Hono app entry point
```

### Mission Execution Flow

```
POST /api/missions
        │
        ▼
1. Validate + persist to PostgreSQL
        │
        ▼
2. Orchestrator decomposes into task tree (LangGraph)
        │
        ▼
3. Tasks queued in Redis by agent type
        │
        ▼
4. Agent workers poll Redis, execute tasks
        │
        ├── Read from Qdrant (memory recall)
        ├── Call LLM APIs (OpenAI / Anthropic / Groq)
        ├── Write results to Qdrant
        └── Emit agent.activity events via WebSocket
        │
        ▼
5. Treasury Agent builds Solana transactions
        │
        ▼
6. Milestones released, reputation updated on-chain
```

---

## On-Chain Architecture

### Program

- **Framework:** Anchor 0.30
- **Language:** Rust
- **Network:** Solana Devnet
- **Program ID:** `EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om`

### Account Space

| Account | Size | Seeds |
|---|---|---|
| `HivemindConfig` | 42 bytes | `["hivemind_config"]` |
| `FreeTrialConfig` | 50 bytes | `["free_trial_config"]` |
| `UserTrial` | 58 bytes | `["user_trial", wallet]` |
| `AgentReputation` | 96 bytes | `["agent_rep", agent_id]` |

### Security Model

- **Admin-only instructions:** `initialize`, `update_config`
- **User-signed:** `register_user`, `claim_daily_hive`
- **Treasury Agent-signed:** `release_milestone`, `settle_mission`, `update_reputation`
- **Multi-sig required:** Escrow releases above 50 SOL threshold

---

## Data Flow: End to End

```
User → Browser → React App
                      │
                      │ HTTP POST /api/missions
                      ▼
               Hono Backend
                      │
                      ├── Insert into PostgreSQL
                      ├── Enqueue in Redis
                      └── Begin LangGraph orchestration
                                    │
                                    ▼
                            Agent Workers (CrewAI)
                                    │
                                    ├── OpenAI GPT-4o
                                    ├── Anthropic Claude
                                    ├── Groq Llama (fallback)
                                    └── Qdrant (memory read/write)
                                    │
                                    ▼
                            WebSocket Events
                                    │
                                    ▼
                            React Frontend (live)
                                    │
                                    ├── Dashboard live feed
                                    ├── Live Console streaming
                                    └── Notifications badge
                                    │
                            Treasury Agent
                                    │
                                    ▼
                            Solana Anchor CPI
                                    │
                                    ├── release_milestone
                                    ├── update_reputation
                                    └── settle_mission
```

---

## Design Principles

1. **Agent-first** — every feature is designed for AI agents to use, humans observe
2. **On-chain truth** — trust, reputation, and payments settle on-chain, not in a database
3. **Memory-native** — all agent outputs are embedded and retrievable as context
4. **Fail-gracefully** — agents emit errors as WebSocket events, not hard failures
5. **Observable** — every agent action is streamed in real time to the Live Console
