---
id: overview
title: Agent Types
sidebar_position: 4
---

# Agent Types

HiveMind ships with nine specialized agents. Each has:

- A **role contract** — what it does, what it doesn't
- A **headline model** — the default model picked for its job (overridable at mission creation)
- An **expert identity** — a persona prompt fragment that frames its system message
- A **deliverable contract** — a structured output it has to satisfy before the swarm can move on

---

## The Nine Specialists

| Agent | Name | Role | Default Model | Identity |
|---|---|---|---|---|
| **Strategy** | Atlas | Architecture, protocol decisions, sequencing | GPT-4o | Ex-YC partner |
| **Research** | Vega | Market validation, competitor analysis, citations | DeepSeek v3 | Senior product researcher |
| **Design** | Lumen | UI specs, layouts, design tokens, brand language | GPT-4.1 | Figma design lead |
| **Development** | Orion | Production-ready code (the only role that edits files) | Llama 4 70B | Staff full-stack engineer |
| **Marketing** | Nyx | Go-to-market plan, copy, social, positioning | Llama 4 70B | Growth marketing lead |
| **Treasury** | Axiom | Budget allocation, on-chain escrow controls, settlement | Mixtral 8x22B | Crypto CFO |
| **Analytics** | Echo | Metrics, projections, KPIs | DeepSeek v3 | Quantitative analyst |
| **Coordination** | Halo | Cross-agent handoffs, dependency tracking, schedule | GPT-4.1 | Engineering manager |
| **Memory** | Sage | Persistent context across sessions | GPT-4o mini | Knowledge curator |

---

## Role Contracts

### Strategy (Atlas)
**Does:** Decomposes the mission into a stage plan. Decides protocol type, architecture stack, sequencing. Writes `notes/Strategy.md`.

**Doesn't:** Write code. Doesn't second-guess Development on implementation details. Hands off to Research.

### Research (Vega)
**Does:** Validates the use case. Maps competitors, conventions, must-have features. Writes `notes/Research.md` with citations.

**Doesn't:** Write code, design layouts, or pick brand colors. Hands off to Design.

### Design (Lumen)
**Does:** Writes the UI spec — component list, layout, color tokens, typography. Saves `design/ui-spec.md`. Sometimes ships a skeleton component as a reference.

**Doesn't:** Implement the full app. That's Development's job.

### Development (Orion)
**Does:** Writes the actual application code. Vite + React + TypeScript + Tailwind by default. Creates `frontend/package.json`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, component files. This is the role whose output the preview iframe actually renders.

**Doesn't:** Plan strategy, project KPIs, or write marketing copy.

**Special behavior:** Uses `reasoning_effort: "none"` on the backend — cuts reasoning-token spend ~30% → 0% with no quality loss on code tasks. Also participates in the auto-fix loop: if the preview throws a runtime error, Development reads the trace and patches the affected file.

### Marketing (Nyx)
**Does:** Headline, social copy, hero CTA, go-to-market plan. Writes `notes/Marketing.md`.

**Doesn't:** Touch the codebase. Marketing is markdown-only.

### Treasury (Axiom)
**Does:** Decides the budget split (compute / tokens / reserve / settlement). Writes `notes/Treasury.md`. Records the on-chain escrow PDA used for the mission.

**Doesn't:** Write code or directly call on-chain instructions. The user's wallet does the signing.

### Analytics (Echo)
**Does:** Projects success metrics. KPIs, expected CTR / conversion / latency / cost. Writes `notes/Analytics.md`.

**Doesn't:** Implement instrumentation. Just specifies what should be measured.

### Coordination (Halo)
**Does:** Tracks handoffs, flags blocked dependencies, summarizes the chain at completion. Writes `notes/Coordination.md`.

**Doesn't:** Override other agents' decisions.

### Memory (Sage)
**Does:** Curates the persistent context the swarm carries between sessions. Writes embeddings to the memory store for future missions to retrieve.

**Doesn't:** Generate new content for the current mission.

---

## Which Agents Run on a Mission

The default roster depends on the priority tier set in the wizard:

| Tier | Agents |
|---|---|
| `low` | Strategy, Development, Treasury |
| `std` | Strategy, Research, Development, Treasury, Coordination |
| `high` | Strategy, Research, Design, Development, Marketing, Treasury, Coordination |
| `crit` | All nine |

You can edit the roster manually on the Mission Create page — adding/removing agents updates the budget estimate in real time.

---

## Per-Agent Model Override

In the **Agent Roster** section of the mission wizard, each selected agent has a model dropdown. Defaults come from the table above; you can override.

Available models are surfaced from `src/lib/agent-models.ts`:

| Tier | Models |
|---|---|
| `light` | GPT-4o mini, GPT-4.1 mini, GPT-5 nano |
| `standard` | GPT-4o, GPT-4.1, GPT-5 mini, Llama 4 70B, Mixtral 8x22B, DeepSeek v3 |
| `reasoning` | o1 mini, o3 mini, Llama 4 405B |
| `premium` | o1, o3, GPT-5.1, GPT-5.5, GPT-5.5 pro, Claude 4.7 Sonnet, Claude 4.7 Opus, Gemini 2.5 Pro |

Today the **light** and **standard** tiers are enabled in the UI. The **reasoning** and **premium** tiers render with a "Soon" badge and are disabled — they advertise the multi-vendor routing roadmap but aren't selectable yet.

> **Backend reality:** Every agent invoke routes through `OPENAI_MODEL_ALL` (currently `gpt-5.5`) regardless of the model the user picks. The non-OpenAI ids (Claude, Llama, Mixtral, DeepSeek, Gemini) are surfaced for the multi-provider story but the runtime falls back to env routing. See [Choosing Models →](../guides/choosing-models) for the full picture.

---

## Agent Execution Order

Within a mission, agents fire in this priority order (set in `AgentWorkspace.tsx`):

```
1. Development   — only role that edits files; fire first so code lands early
2. Coordination  — flags blockers as soon as Development saves
3. Design        — UI spec for Development to reference (already saved by now)
4. Strategy      — pre-Development plan (already saved by now)
5. Research      — supporting context
6. Marketing
7. Treasury
8. Analytics
9. Memory
```

This is *follow-up* order (used when the user sends a message after launch). The *initial* swarm run executes in a more natural order: Strategy → Research → Design → Development → Marketing → Treasury → Coordination, with later agents seeing the outputs of earlier ones.

---

## Reputation

Every agent has an on-chain reputation PDA at `["reputation", agent_pubkey]`. Trust score is a signed integer the protocol authority can update via `update_agent_reputation(delta)`. The Reputation page (`/reputation`) reads these PDAs and displays per-agent trust history.

---

## Next

- **[Choosing Models →](../guides/choosing-models)** — per-agent model selection details
- **[First Mission →](../guides/first-mission)** — walk through an end-to-end run
- **[Live Preview →](../guides/live-preview)** — Sandpack + the auto-fix loop
