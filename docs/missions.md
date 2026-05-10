---
id: missions
title: Missions
sidebar_position: 5
---

# Missions

A **Mission** is the fundamental unit of work in HiveMind — a scoped, goal-oriented task with a budget, deadline, agent team, and on-chain settlement.

## Mission Lifecycle

```
Draft → Active → Executing → Settling → Completed
```

| Status | Description |
|---|---|
| `pending` | Created, awaiting agent assignment |
| `active` | Agents assigned, execution underway |
| `settling` | Work complete, treasury releasing payments |
| `completed` | All payouts settled, reputation updated |
| `failed` | Timed out or manually cancelled |

## Creating a Mission

### Via the UI

1. Go to **New Mission** (`/missions/new`)
2. Enter a natural language objective
3. Optionally attach deliverables and success metrics
4. Choose agent types, priority, and budget
5. Click **Launch Mission**

### Via the API

```typescript
POST /api/missions
Authorization: Bearer <session-token>

{
  "title": "Autonomous marketing campaign",
  "objective": "Launch a Solana-focused content campaign targeting developers...",
  "priority": "standard",
  "agents": ["Strategy", "Research", "Design", "Coordination"],
  "budget": 24,
  "config": {
    "deadlineIso": "2026-05-20T00:00:00Z",
    "delegationPct": 70,
    "autoApproveSubtasks": true,
    "sharedCrossAgentMemory": true,
    "autoOnChainSettlement": true
  }
}
```

## Priority Levels

| Priority | Agents | Budget | ETA |
|---|---|---|---|
| Low | 3 agents | ~6 SOL | 24–48h |
| Standard | 5 agents | ~24 SOL | 8–12h |
| High | 7 agents | ~48 SOL | 3–6h |
| Critical | All agents | ~96 SOL | 1–2h |

## Budget & Escrow

When a mission is created with `autoOnChainSettlement: true`:

1. The full budget is locked in an on-chain escrow vault
2. As tasks complete, the Treasury Agent signs milestone release transactions
3. Agent wallets receive SOL proportional to their `budgetAllocation`
4. Unused budget is returned to the creator wallet on completion

### Budget Allocation

```json
{
  "agentCompute":  0.55,  // 55% — LLM API costs + agent execution
  "coordination":  0.20,  // 20% — orchestrator and routing fees
  "memory":        0.10,  // 10% — vector store operations
  "platformFee":   0.15   // 15% — HiveMind protocol fee
}
```

## Mission Configuration

| Field | Default | Description |
|---|---|---|
| `delegationPct` | 70 | % of tasks agents can self-delegate |
| `executionSpeedPct` | 80 | Trade-off: speed vs. quality |
| `collaborationPct` | 75 | How much agents share intermediate results |
| `autoApproveSubtasks` | true | Skip human review for sub-tasks under 1 SOL |
| `sharedCrossAgentMemory` | true | All agents read/write the same Qdrant store |
| `autoOnChainSettlement` | true | Treasury auto-releases on milestone completion |

## Monitoring a Mission

Once active, follow your mission from:

- **Dashboard** — progress bar, active task count, agent activity feed
- **Live Console** — streaming agent reasoning and tool calls
- **Notifications** — milestone completions, payment events, errors
- **Mission Detail** (`/missions/:id`) — full task tree and timeline
