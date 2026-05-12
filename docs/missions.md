---
id: missions
title: Missions
sidebar_position: 5
---

# Missions

A **mission** is the unit of work in HiveMind. One sentence in, one shipped artifact out, with a real on-chain budget attached.

---

## Anatomy of a Mission

| Field | Type | Meaning |
|---|---|---|
| `id` | `string` | `M-247`-style internal id (Postgres) |
| `title` | `string` | First line of the prompt, auto-extracted |
| `objective` | `string` | Full user prompt |
| `priority` | `"low" \| "std" \| "high" \| "crit"` | Drives the default agent roster + budget |
| `status` | `"active" \| "queued" \| "completed" \| "paused"` | Lifecycle state |
| `agents` | `string[]` | Roster of role names |
| `budget` | `number` | Total SOL deposited into escrow (cap: 10) |
| `cost` | `number` | Actual SOL spent so far |
| `progress` | `number` | 0–100 percent |
| `eta` | `string` | "4h 20m"-style human estimate |
| `confidence` | `number` | Strategy agent's pre-launch confidence |
| `followUpCount` | `number` | How many follow-up messages have been sent since the mission settled |
| `config.agentModels` | `Record<string,string>` | Per-role model id overrides |
| `config.deliverables` | `string[]` | Promised outputs |
| `config.successMetrics` | `Array<{label,target}>` | KPIs |
| `config.deadlineIso` | `string \| null` | Hard deadline |
| `config.budgetAllocation` | `MissionBudgetAllocation` | How the SOL is split (compute / tokens / reserve / settlement) |

---

## Priority Tiers

Each tier auto-populates a different agent roster and a different budget default. You can override both before launching.

| Tier | Default agents | Default budget |
|---|---|---|
| `low` | Strategy, Development, Treasury | 1.5 SOL |
| `std` | Strategy, Research, Development, Treasury, Coordination | 3.5 SOL |
| `high` | Strategy, Research, Design, Development, Marketing, Treasury, Coordination | 6 SOL |
| `crit` | All nine (Strategy, Research, Design, Development, Marketing, Treasury, Analytics, Coordination, Memory) | 9 SOL |

The hard cap is **10 SOL** regardless of tier — even `crit` stays inside the slider.

---

## Lifecycle

```
queued ─▶ active ─▶ completed
           │
           ▼
         paused (user-initiated, resumable)
```

| State | What it means | Buttons available |
|---|---|---|
| `queued` | Created but swarm hasn't started | Edit, Delete |
| `active` | Swarm is running | Pause, Accelerate, Delete |
| `paused` | User clicked Pause | Resume, Delete |
| `completed` | Swarm finished or progress hit 100% | (Pause/Accelerate disabled) Follow-up chat available |

Once a mission is `completed`, the Pause and Accelerate buttons on the Dashboard are disabled with a tooltip — there's nothing to pause or speed up. The Agent Workspace remains accessible for follow-up chats (see [Follow-up Paywall →](./guides/follow-up-paywall)).

---

## Creating a Mission

### Via UI

Navigate to `/missions/new`. The wizard has five numbered sections:

1. **Mission Brief** — the prompt. Rotating placeholders cycle through example prompts every 3 seconds.
2. **Deliverables** — checklist of promised outputs (auto-suggested by the wizard based on prompt keywords; user can edit).
3. **Agent Roster** — pick which specialists run on this mission. Adding/removing changes the budget estimate.
4. **Treasury Allocation** — single slider for total SOL, four sub-sliders for compute / token usage / retry buffer / settlement.
5. **Success Metrics** — optional KPIs the swarm will optimize toward.

Click **Launch Mission**. The mission lands in your Dashboard immediately; the swarm begins executing.

### Via API

```bash
curl -X POST https://hivemind-backend-prod.eba-2pwjk2c2.ap-south-1.elasticbeanstalk.com/api/missions \
  -H "Authorization: Bearer $HM_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "NFT minting landing page",
    "objective": "Build a Solana NFT minting landing page — hero, gallery, mint button.",
    "priority": "high",
    "agents": ["Strategy","Research","Design","Development","Marketing","Treasury","Coordination"],
    "budget": 6,
    "config": {
      "agentModels": {
        "Strategy": "gpt-4o",
        "Development": "llama-4-70b",
        "Treasury": "mixtral-8x22b"
      },
      "deliverables": ["Hero section","Gallery","Mint button"],
      "deadlineIso": "2026-05-19T18:00:00Z"
    }
  }'
```

Returns `{ mission: Mission }` on success.

---

## On-Chain Funding

A mission's `budget` field is what the user *committed* to spend. To actually move SOL on-chain into the mission PDA, the wallet must sign a `fund_mission` instruction.

This is wired automatically when you launch a mission with sufficient devnet SOL — the frontend bundles `create_mission(mission_id)` + `fund_mission(lamports)` into a single transaction via `useMissionPayment()`. If the wallet rejects or the balance is insufficient, the mission still gets created in the database, but no on-chain escrow exists for it.

See [On-Chain Settlement →](./guides/on-chain-settlement) for the full escrow lifecycle.

---

## Watching a Mission Run

The **Agent Workspace** (`/agents`) is the live view. Three panels:

| Panel | Layout token | Content |
|---|---|---|
| Chat | `chat` | Handoff bubbles, agent responses, auto-fix diffs |
| Code | `code` | File tree + selected file content |
| Preview | `preview` | Sandpack live iframe rendering the generated app |

A toolbar at the top lets you switch between **Chat-only**, **Split (chat + code/preview)**, and **Code-only**. There's also a fullscreen toggle that hides the sidebar and top nav.

Real-time events flow over WebSocket:
- `agent.thinking` → spinner on a bubble
- `agent.delegating` → handoff to next role
- `agent.executing` → currently working
- `agent.saved` → wrote a file (artifact tree updates)
- `preview.ready` → Sandpack can bundle
- `preview.error` → triggers the auto-fix loop
- `mission.completed` → status flips, follow-up paywall arms

---

## Pausing and Accelerating

While a mission is `active`, the Dashboard hero has two buttons:

- **Pause** — flips `status` to `paused`. The swarm continues background polling but stops dispatching new agent invokes until you resume.
- **Accelerate** — triggers a fresh `swarm-run` to push all pending agents to work in parallel. Useful when an agent has been "thinking" for a while.

Both buttons are **disabled** when the mission is `completed` (status === "completed" OR progress ≥ 100% OR every task on the server is done).

---

## Deleting a Mission

Click the trash icon next to Pause / Accelerate. This:
1. Removes the mission from your `localStorage` immediately
2. Sends `DELETE /api/missions/:id` to the backend (per-wallet auth checked)
3. Does **not** clean up the on-chain mission PDA — that requires a separate `settle_mission` call to recover the escrow. (Lost SOL = the cost of the cleanup. On devnet, no real cost.)

---

## Next

- **[Choosing Models →](./guides/choosing-models)** — per-agent model selection
- **[Live Preview →](./guides/live-preview)** — Sandpack + auto-fix
- **[On-Chain Settlement →](./guides/on-chain-settlement)** — escrow lifecycle
- **[Follow-up Paywall →](./guides/follow-up-paywall)** — what happens after completion
