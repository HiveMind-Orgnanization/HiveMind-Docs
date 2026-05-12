---
id: custom-agent
title: Building a Custom Agent
sidebar_position: 9
---

# Building a Custom Agent

HiveMind ships with nine specialist agents (Strategy, Research, Design, Development, Marketing, Treasury, Analytics, Coordination, Memory). This guide walks you through adding a tenth — or replacing one of the defaults with your own — by editing the agent runtime directly.

> **Heads up:** there is no agent marketplace or third-party plugin system yet. To add a custom agent today you fork the backend, add code, and redeploy. A pluggable runtime is on the post-hackathon roadmap.

---

## Anatomy of an Agent

Every HiveMind agent is defined by five things:

| Piece | Where it lives | What it does |
|---|---|---|
| **Role name** | `src/services/agent-runtime.ts` constant | Identifier used everywhere (`"Strategy"`, `"Design"`, etc.) |
| **Display profile** | `src/services/postgres-hivemind-store.ts` seed | Name (e.g. "Atlas"), trust score, default model |
| **System prompt** | `src/services/agent-runtime.ts` per-role string | The persona + deliverable contract |
| **Headline model** | `src/lib/agent-models.ts` `ROLE_HEADLINE_MODEL` (frontend) | Default model id when no override is set |
| **Execution priority** | `src/app/AgentWorkspace.tsx` `ROLE_PRIORITY` | Order in follow-up invocations |

---

## Walkthrough — Adding a "QA" Agent

Let's add a tenth agent: **QA**, a quality-assurance specialist that reviews Development's output for accessibility, security, and code-style issues.

### 1. Pick a role name

Use PascalCase, single word. The name is referenced as a string throughout the codebase.

```
"QA"
```

### 2. Add the system prompt + role contract (backend)

Open `hivemind-backend/src/services/agent-runtime.ts`. Find the `ROLE_EXPERT_IDENTITY` map and add an entry:

```typescript
const ROLE_EXPERT_IDENTITY: Record<string, string> = {
  Strategy: "You are an ex-YC partner...",
  // ... existing entries ...
  QA: "You are a senior QA engineer with 10+ years of experience auditing production codebases for accessibility (WCAG AA), security (OWASP Top 10), and maintainability. You review code Development has produced and write a concise QA report.",
};
```

Then find the per-role deliverable contract (look for `roleInstruction` switch or similar in the routes file). Add:

```typescript
case "QA":
  return `Review the artifacts saved by Development under frontend/. Produce notes/QA.md with:
  - Accessibility findings (axe-style: WCAG criteria + severity)
  - Security flags (auth bypass, XSS, unsafe HTML, eval, etc.)
  - Code-quality issues (any dead code, missing error handling, etc.)
  Be specific: cite file paths and line ranges.`;
```

### 3. Add the agent profile (backend)

Open `hivemind-backend/src/services/postgres-hivemind-store.ts`. Find the seed agent list and add:

```typescript
{
  id: "agent-quartz",
  name: "Quartz",
  specialization: "QA",
  model: "DeepSeek v3",         // display label, not the actual model id
  reputation: 4.83,
  missionsCompleted: 0,
  trustScore: 88,
},
```

### 4. Add the headline model + UI catalog entry (frontend)

Open `hivemind-frontend/src/lib/agent-models.ts`. Add to `ROLE_HEADLINE_MODEL`:

```typescript
export const ROLE_HEADLINE_MODEL: Record<string, string> = {
  Strategy: "gpt-4o",
  // ... existing entries ...
  QA: "deepseek-v3",   // ← new
};
```

If you want a new *model* id (not just reuse an existing one), also add it to `AGENT_MODEL_CATALOG`.

### 5. Add to the agent picker UI (frontend)

Open `hivemind-frontend/src/app/MissionCreate.tsx`. Find `allAgents` (or the equivalent constant) and add:

```typescript
{
  name: "QA",
  spec: "Quality & Audit",
  color: "#84cc16",      // pick an unused color
  default: false,        // off by default (opt-in)
  rep: 4.83,
  perf: 88,
},
```

Also add to `PRIORITY_AGENTS` if you want QA included in default rosters for a tier:

```typescript
const PRIORITY_AGENTS: Record<string, string[]> = {
  low:  ["Strategy", "Development", "Treasury"],
  std:  ["Strategy", "Research", "Development", "Treasury", "Coordination"],
  high: ["Strategy", "Research", "Design", "Development", "Marketing", "Treasury", "Coordination", "QA"],  // ← add
  crit: ["Strategy", "Research", "Design", "Development", "Marketing", "Treasury", "Analytics", "Coordination", "Memory", "QA"],  // ← add
};
```

### 6. Add to the follow-up priority list (frontend)

Open `hivemind-frontend/src/app/AgentWorkspace.tsx`. Find `ROLE_PRIORITY` (around the `sendMessage` function) and add QA at the appropriate slot:

```typescript
const ROLE_PRIORITY: Record<string, number> = {
  Development: 0,
  Coordination: 1,
  QA: 2,            // ← QA runs after Coordination, before Design
  Design: 3,
  Strategy: 4,
  Research: 5,
  Marketing: 6,
  Treasury: 7,
  Analytics: 8,
  Memory: 9,
};
```

### 7. (Optional) On-chain reputation

If you want QA to have an on-chain reputation PDA, run `init_agent_reputation(quartz_pubkey)` against the Solana program once. The agent profile's `id` field is just a database row — the on-chain pubkey is separate. See [Contracts →](../contracts).

### 8. Test it

```bash
# Backend
cd hivemind-backend && npm run dev

# Frontend
cd ../hivemind-frontend && pnpm dev
```

Create a new mission and confirm:
- QA appears in the agent picker
- Its model dropdown shows DeepSeek v3 by default
- Launching a mission with QA selected actually invokes the agent
- `notes/QA.md` shows up in the artifact tree after the swarm runs

---

## Where Each Piece Lives — Quick Reference

| To add | File |
|---|---|
| Role behavior (system prompt) | `hivemind-backend/src/services/agent-runtime.ts` |
| Agent display profile | `hivemind-backend/src/services/postgres-hivemind-store.ts` |
| Headline model default | `hivemind-frontend/src/lib/agent-models.ts` |
| Agent picker card | `hivemind-frontend/src/app/MissionCreate.tsx` (`allAgents`) |
| Follow-up priority | `hivemind-frontend/src/app/AgentWorkspace.tsx` (`ROLE_PRIORITY`) |
| On-chain reputation | `hivemind-contracts/programs/hivemind-protocol/src/lib.rs` (`init_agent_reputation`) |

---

## What Doesn't Exist Yet

- A registry / marketplace where third parties can publish agents without forking the repo
- A plugin API for loading agent definitions at runtime
- A sandbox so user-provided agents can run safely
- Per-agent fees that route a share of mission revenue to the agent author

These are all on the roadmap. For now, custom agents require forking the backend + frontend, which is fine for hackathon-scope work but not for serving external developers.

---

## Common Issues

### Agent never gets invoked
- Check the agent name matches in all five files (typos in `"QA"` vs `"Qa"` will break the dispatcher)
- Confirm the agent is in `mission.agents` after launch (`localStorage.getItem("hm-missions:" + walletPk)`)
- Look at the backend logs — if there's no `roleInstruction` for your role, the runtime falls back to a generic prompt and writes no artifact

### Agent writes to the wrong file
- The role contract in `agent-runtime.ts` should explicitly name the target path (e.g. `notes/QA.md`)
- If the agent saves to a non-standard path, the dashboard won't pick it up

### Frontend doesn't show the agent card
- Vite caches aggressively — restart `pnpm dev` after editing `MissionCreate.tsx`

---

## Next

- **[Choosing Models →](./choosing-models)** — pick the right model for your new role
- **[Customization →](./customization)** — tune prompts, budgets, and routing
- **[Agent Types →](../agents/overview)** — what the existing nine do
