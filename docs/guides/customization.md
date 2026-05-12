---
id: customization
title: Customizing HiveMind
sidebar_position: 8
---

# Customizing HiveMind

This guide covers the customization levers that work today: env-var overrides, per-mission config, agent persona tuning, and the model catalog. For full custom agents see [Custom Agents →](./custom-agent).

---

## Frontend customization (no code changes)

These work purely through env vars on the Vercel deployment.

| Variable | Default | Effect |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8787` | Backend base URL |
| `VITE_SOLANA_RPC_URL` | `clusterApiUrl("devnet")` | Solana RPC endpoint — point at Helius / QuickNode to escape devnet rate limits |
| `VITE_HM_TREASURY_PUBKEY` | `G4o8wSS85Jzc…xWPc` (funder) | Recipient for Treasury deposits + follow-up payments |

To change them on Vercel:

```bash
vercel env add VITE_HM_TREASURY_PUBKEY production
vercel deploy --prod
```

---

## Backend customization (env vars)

| Variable | Default | Effect |
|---|---|---|
| `OPENAI_MODEL_ALL` | `gpt-5.5` | Backend routes every agent call to this model. Multi-vendor routing is on the roadmap; today this is the single source of truth. |
| `OPENAI_MODEL_HEAVY` | `gpt-5.5` | Model used for heavy codegen (Development, Coordination on long missions) |
| `OPENAI_MODEL_CRIT` | `gpt-5.5` | Model used for `crit` priority missions |
| `SWARM_BUILD_REPAIR_MAX_ROUNDS` | `6` | Max auto-fix rounds before giving up on a broken preview |
| `FUNDER_SECRET_KEY` | — | Keypair that sponsors free-trial registrations |
| `PROGRAM_ID` | `EV447F…Q5om` | Solana program ID (if you redeploy your own) |

---

## Per-mission customization

Every mission stores a `config` object that lets you tune behavior without touching code. From the UI, these are the wizard fields. From the API, post directly:

```typescript
POST /api/missions
{
  "title": "...",
  "objective": "...",
  "priority": "high",
  "agents": ["Strategy", "Development", "Treasury"],
  "budget": 4,
  "config": {
    // Per-role model override (see Choosing Models)
    "agentModels": {
      "Development": "llama-4-70b",
      "Treasury": "mixtral-8x22b"
    },
    // Promised outputs the swarm tracks
    "deliverables": ["Hero section", "Mint button", "Gallery"],
    // KPIs the swarm optimizes toward
    "successMetrics": [
      { "label": "Lighthouse Performance", "target": "≥ 95" },
      { "label": "First Contentful Paint", "target": "< 1.2s" }
    ],
    // Hard deadline (drives ETA + scheduling)
    "deadlineIso": "2026-05-19T18:00:00Z",
    // How much of each task to delegate vs. handle directly (0-100)
    "delegationPct": 70,
    // How fast to execute (lower = more thorough, higher = faster)
    "executionSpeedPct": 50,
    // Cross-agent collaboration level (0-100)
    "collaborationPct": 65,
    // Auto-approve subtasks below this confidence threshold
    "autoApproveSubtasks": true,
    // Share memory chunks across agents in real time
    "sharedCrossAgentMemory": true,
    // Try to settle escrow on-chain automatically (MVP: not wired)
    "autoOnChainSettlement": false,
    // Budget split across compute / tokens / reserve / settlement (must sum to 1.0)
    "budgetAllocation": {
      "agentCompute": 0.45,
      "tokenUsage": 0.22,
      "escrowReserve": 0.20,
      "settlementBuffer": 0.13
    }
  }
}
```

All `config` fields are optional — defaults are populated by the Mission Create wizard.

---

## Customizing agent personas

Each role has an "expert identity" string injected into its system prompt. This is what makes Strategy talk like an ex-YC partner and Treasury like a CFO.

Edit `hivemind-backend/src/services/agent-runtime.ts`:

```typescript
const ROLE_EXPERT_IDENTITY: Record<string, string> = {
  Strategy: "You are an ex-YC partner with deep experience helping early-stage founders pick architecture and sequence go-to-market...",
  Design: "You are a senior Figma design lead...",
  // ... edit any of these to change tone
};
```

Bigger structural changes (output format, file paths, deliverable checklist) live in the `roleInstruction` helper in `src/routes/missions.ts`. That's where each role's promised output contract is defined.

---

## Customizing the model catalog

The list of models surfaced in the Mission Create dropdown lives in `hivemind-frontend/src/lib/agent-models.ts`. To add or remove a model:

```typescript
export const AGENT_MODEL_CATALOG: readonly AgentModel[] = [
  // existing entries...
  { id: "your-model-id", label: "Your Model", desc: "Description", solMult: 1.8, tier: "standard" },
] as const;
```

Then, **and this is the important part**, route the model on the backend. Add a case in `hivemind-backend/src/services/agent-runtime.ts` that maps the model id to the right SDK call. If you don't, the model id is stored on the mission but the actual call still goes to `OPENAI_MODEL_ALL`.

### Locking a tier

To make a model "Coming soon" (disabled in the dropdown), set its tier to something not in `ENABLED_MODEL_TIERS`:

```typescript
const ENABLED_MODEL_TIERS = new Set(["light", "standard"]);
```

`reasoning` and `premium` are intentionally locked today.

---

## Customizing the priority tiers

The four mission priority tiers (`low` / `std` / `high` / `crit`) drive default agent rosters and budgets. They live in `hivemind-frontend/src/app/MissionCreate.tsx`:

```typescript
const PRIORITY_AGENTS: Record<string, string[]> = {
  low: ["Strategy", "Development", "Treasury"],
  // ...
};

const PRIORITY_BUDGET: Record<string, number> = {
  low: 1.5,
  std: 3.5,
  high: 6,
  crit: 9,
};
```

Hard cap on budget is 10 SOL (the slider's max). To raise it, search `MissionCreate.tsx` for `max-w-[10` / `10 SOL` references.

---

## Customizing the preview build

The preview-manager (`hivemind-backend/src/services/preview-manager.ts`) applies several normalizations to every artifact tree before bundling. Tune them:

| Behavior | Where |
|---|---|
| Vite version clamp (forces `^5.4.21`) | `normalizeLegacyViteFrontendPackageJson` |
| postcss / tailwind force-`.cjs` | `normalizeTailwindForBuild` |
| Malformed double-extension purge | `purgeMalformedDoubleExtensionFiles` |
| 5-attempt heal loop | `start()` retry budget constant |

If you change `SWARM_BUILD_REPAIR_MAX_ROUNDS` (env var), the **frontend's** auto-fix budget changes too. Lower it for faster failure surfacing; raise it for stubborn missions.

---

## Customizing the realtime channels

The WebSocket hub broadcasts on two channel patterns:

```typescript
// global — every wallet sees this
hub.broadcast({ type: "payment.created", payload: ... }, "global");

// mission:<id> — only listeners on this mission see it
hub.broadcast({ type: "mission.completed", payload: ... }, `mission:${id}`);
```

Add new event types in `src/services/realtime.ts`. The frontend's `useHiveMindActivity` hook (and its siblings) listen to these channels — extend the type union and add a handler.

---

## What you can't customize (yet)

- The on-chain program logic — `hivemind-contracts/programs/hivemind-protocol/src/lib.rs` is the source of truth. To change `fund_mission` / `settle_mission` math, redeploy.
- The wallet-signature auth flow — `requireWallet` is fixed; you can add additional checks but not remove the wallet requirement
- The `localStorage` key prefix — `hm-*:<walletPk>` is hard-coded to enforce per-wallet scoping
- The Sandpack bundler's behavior — the iframe uses Sandpack's public API; we can't change its retry semantics

---

## Next

- **[Choosing Models →](./choosing-models)** — per-agent model overrides
- **[Custom Agents →](./custom-agent)** — add a tenth agent
- **[Efficient Usage →](./efficient-usage)** — get the most out of a SOL budget
