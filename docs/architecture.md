---
id: architecture
title: Architecture
sidebar_position: 3
---

# Architecture

HiveMind has four cleanly separated layers. Each can be deployed independently, and each speaks to its neighbors through a small, explicit interface.

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
│                  (Solana wallet + browser)                   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS + WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                       Frontend (Vercel)                      │
│                                                              │
│  Vite + React + TypeScript · Tailwind · motion/react        │
│  Sandpack live preview · Solana wallet-adapter              │
│  Pages: Landing, Dashboard, MissionCreate, AgentWorkspace,  │
│         Treasury, Reputation, Memory, Settings              │
└────────────────────────────┬────────────────────────────────┘
                             │ REST + WebSocket
┌────────────────────────────▼────────────────────────────────┐
│             Backend (AWS Elastic Beanstalk · ap-south-1)     │
│                                                              │
│  Fastify 5 · TypeScript                                      │
│  Routes: /api/missions, /api/agents, /api/payments,         │
│          /api/trial, /api/memory, /api/invoke-async         │
│  Services: agent-runtime, preview-manager, realtime hub     │
│  Auth: JWT wallet-signature                                  │
│                                                              │
│  Storage: Neon Postgres                                      │
│  Realtime: WebSocket hub                                     │
│  LLM: OpenAI SDK                                             │
└────────────────────────────┬────────────────────────────────┘
                             │ @solana/web3.js · Anchor CPI
┌────────────────────────────▼────────────────────────────────┐
│                  Solana On-Chain Layer (Devnet)              │
│                                                              │
│  Anchor 0.30 · Rust · Program EV447F…Q5om                   │
│                                                              │
│  Instructions:                                               │
│   · create_mission(mission_id) → mission PDA                │
│   · fund_mission(lamports)     → SOL into PDA               │
│   · settle_mission(lamports, recipient) → SOL out of PDA    │
│   · init_agent_reputation(agent_pubkey)                     │
│   · update_agent_reputation(delta)                          │
│   · register_user (free-trial)                              │
│   · use_free_trial                                          │
│   · claim_daily_hive                                        │
│                                                              │
│  HIVE SPL token mint · global config PDA · free-trial PDA   │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend — Visible Surface

Routes are configured in `src/app/App.tsx`:

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing | Marketing surface with embedded demo video |
| `/dashboard` | Dashboard | Mission analytics, agent status, coordination graph |
| `/missions/new` | MissionCreate | Wizard: prompt → agents → models → budget → launch |
| `/missions/:id` | MissionDetail | Per-mission deep view |
| `/agents` | AgentWorkspace | Chat with the swarm + Sandpack live preview + code tree |
| `/treasury` | Treasury | On-chain deposits, cashflow, escrow composition |
| `/reputation` | Reputation | Per-agent trust scores from on-chain PDAs |
| `/memory` | MemoryExplorer | Past mission artifacts and shared context |
| `/marketplace` | Marketplace | (Future) third-party specialist agents |
| `/analytics` | Analytics | Cross-mission metrics |
| `/console` | LiveConsole | Raw event stream from the realtime hub |
| `/settings` | Settings | Wallet, model preferences, trial state |

**State boundaries:**
- Mission state — `useMissions()` hook backed by per-wallet `localStorage` (`hm-missions:<walletPk>`) and synced to backend on auth
- Live telemetry — `useMissionLiveMetrics()`, `useHiveMindActivity()`, `usePayments()`, `useAgents()`, `useTasks()` — all WebSocket-subscribed
- Wallet state — `@solana/wallet-adapter-react` (`useWallet`, `useConnection`)
- Auth — `hm_jwt` in `localStorage`, attached to every authed request

---

## Backend — Orchestration Spine

The backend is a single Fastify process with three subsystems.

### HTTP Routes (`src/routes/*`)
| Path | Purpose |
|---|---|
| `/api/missions` | CRUD missions (per-wallet scoping) |
| `/api/missions/:id/swarm-run` | Kick off an async swarm |
| `/api/missions/:id/preview/start` | Async preview build |
| `/api/missions/:id/preview/status/:jobId` | Poll preview status |
| `/api/invoke-async` + `/api/invoke-status/:jobId` | Single-agent invoke with polling |
| `/api/agents` | List backend agent profiles |
| `/api/payments` + `/api/payments/intent` | Record on-chain payment intents |
| `/api/trial/*` | Free-trial registration, daily HIVE claim, fund-wallet |
| `/api/memory/*` | Shared memory chunks |
| `/api/health` | Liveness probe |

### Agent Runtime (`src/services/agent-runtime.ts`)
This is where each agent's system prompt, role contract, and model selection live. Key design choices:
- Every OpenAI-compatible model id routes through `OPENAI_MODEL_ALL` (currently `gpt-5.5`) so the UI's multi-vendor story stays consistent with cost/quality on the backend.
- Codegen roles use `reasoning_effort: "none"` — this cuts reasoning-token spend ~30% → 0% and gives a ~4× speedup with no quality loss for code tasks.
- A `ROLE_EXPERT_IDENTITY` per role injects persona context into the system prompt (Strategy = ex-YC partner, Design = Figma lead, etc.).

### Realtime Hub (`src/services/realtime.ts`)
WebSocket fan-out with two channel patterns:
- `global` — system-wide notifications (`payment.created`, `mission.completed`, etc.)
- `mission:<id>` — per-mission progress updates

The frontend subscribes to both on workspace load; the dashboard subscribes to `global` only.

### Preview Manager (`src/services/preview-manager.ts`)
Spins up an ephemeral Vite dev server for each mission's `.hivemind-previews/<session>` directory. Hard-learned normalizations applied before bundle:
- Clamp any `vite` version outside `^5.4.x` down to `^5.4.21` (rolldown bundler crashes on 6/7)
- Force `postcss.config.cjs` + `tailwind.config.cjs` extensions (ESM/CJS mismatch otherwise)
- Strip `rolldown` / `rolldown-vite` / `@rolldown/*` deps
- Purge malformed double-extension files (`*.css.tsx`)
- 5-attempt heal loop with auto-`npm install`, JSX→jsx conversion, rolldown re-normalize

---

## Solana Layer — Coordination Substrate

The on-chain program lives at `hivemind-contracts/programs/hivemind-protocol/src/lib.rs`. PDAs (program-derived addresses):

| PDA | Seeds | Purpose |
|---|---|---|
| Mission | `["mission", u64 mission_id]` | Per-mission escrow + status |
| Agent reputation | `["reputation", agent_pubkey]` | Per-agent trust score |
| Global config | `["config"]` | Authority for reputation updates |
| Free-trial config | `["free_trial_config"]` | Trial state shared across users |
| User trial state | `["user_trial", user_pubkey]` | Per-user trial slot + daily HIVE claim cursor |
| HIVE mint | standard SPL token mint | Trial credits and (future) gated model access |

**Key flow — mission lifecycle:**
1. `create_mission(mission_id)` — initialize the PDA owned by the caller
2. `fund_mission(lamports)` — caller transfers SOL into the PDA; `escrow_lamports += lamports`
3. *(Work happens off-chain; backend orchestrates the swarm)*
4. `settle_mission(lamports, recipient)` — PDA-signed transfer of SOL out to a recipient pubkey; `escrow_lamports -= lamports`

Settlement requires the original mission owner's signature. There's no automatic settler in the MVP — agent payouts are recorded as backend payment intents and settled via the same `settle_mission` instruction when triggered.

---

## Key Architectural Choices

### Specialists over generalists
Nine narrow role contracts beat one big tool-using agent. The bet: a model with a tight contract and a clear deliverable produces more reliable output than the same model with a "do everything" prompt and a tool registry.

### Async everywhere
Vercel's 30-second rewrite limit makes any long sync request impossible. Every endpoint that runs an LLM call uses the `202 + jobId` + polling pattern. Internally the backend keeps the work running even if the client disconnects.

### Per-wallet scoping
Missions, JWTs, localStorage keys — all keyed on the connected wallet's public key. A wallet that never logged in can't see missions from a wallet that did. This is enforced both client-side (localStorage key prefix) and server-side (`requireWallet` hook on every authed route).

### On-chain only when it matters
The Anchor program holds escrow, reputation, and the HIVE mint. Everything else — task graph, chat history, artifact tree, model selection, swarm orchestration — lives off-chain. That separation keeps the on-chain surface auditable and the off-chain surface fast.

---

## Where Things Live

| Concern | Lives In |
|---|---|
| Mission state (creation, status) | Neon Postgres (`missions` table) + per-wallet `localStorage` |
| Agent profiles (default model, name) | Backend hard-coded list, returned by `/api/agents` |
| Per-mission model override | `mission.config.agentModels` (Postgres `config` JSONB column) |
| Chat messages | `localStorage` (workspace seed) + Postgres workspace snapshots |
| Generated artifacts | `.hivemind-previews/<session>/frontend/` on the backend host |
| Preview build output | Sandpack iframe (rendered client-side from artifact tree) |
| On-chain reputation | Solana PDA per agent pubkey |
| Free-trial credits | Solana PDA per user wallet + HIVE SPL balance |
| Payment intents | Postgres `payments` table; on-chain confirmation via wallet signature |
| Real-time events | WebSocket only (no polling fallback for the WS itself) |

---

## Next

- **[Agent Types →](./agents/overview)** — what each specialist does
- **[Missions →](./missions)** — lifecycle and statuses
- **[Treasury →](./treasury)** — escrow math + deposit flow
- **[Contracts →](./contracts)** — on-chain program details
