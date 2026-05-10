---
id: efficient-usage
title: Using HiveMind Efficiently
sidebar_position: 5
---

# Using HiveMind Efficiently

HiveMind is most effective when missions are well-scoped, memory is curated, and agent teams are matched to the task. This guide covers patterns that consistently produce better results.

---

## Writing Effective Mission Objectives

The objective is the single most important input. Vague objectives produce generic outputs. Specific objectives produce production-ready deliverables.

### Low-quality objective ❌
```
Do some marketing research
```

### High-quality objective ✓
```
Research the top 10 Solana DeFi protocols by TVL that launched in Q1 2026.
For each: name, TVL, growth rate vs. Q4 2025, primary user segment, and top 3
differentiators. Output a structured table + a 500-word executive summary
highlighting the #1 opportunity for a new entrant.
```

**Rules for good objectives:**
1. State the deliverable format (table, report, code, tweets, etc.)
2. Include a scope constraint (top 10, Q1 2026, Solana only)
3. Name the intended audience (developers, investors, CTOs)
4. Specify the desired length or depth
5. Mention any constraints or must-haves

---

## Choosing the Right Agent Team

Each agent type costs compute. Only include agents whose capabilities the mission actually needs.

### Research missions

```
Agents: Research + Analytics + Strategy
```

Research finds the data. Analytics quantifies it. Strategy structures the output and writes the executive summary.

### Marketing campaign

```
Agents: Strategy + Research + Design + Analytics
```

Strategy decomposes the campaign. Research does competitive analysis. Design drafts all copy and content. Analytics projects performance metrics.

### Technical prototype

```
Agents: Strategy + Development + Research
```

Strategy scopes the project. Research finds relevant APIs and libraries. Development generates the code.

### Treasury/governance operations

```
Agents: Treasury + Analytics + Coordination
```

Treasury handles on-chain transactions. Analytics monitors budget burn. Coordination routes status updates.

### Full-scale product launch

```
Agents: All 7
```

Only use all 7 agents when the mission genuinely requires every domain — most missions don't. Running 7 agents on a focused task wastes budget and generates noise.

---

## Budget Allocation

Budget drives agent quality. Agents use their compute quota to make more LLM calls and use more expensive models.

**Rough guidelines:**

| Mission type | Recommended budget | ETA |
|---|---|---|
| Quick research report | 4–6 SOL | 2–4h |
| Marketing campaign | 20–28 SOL | 6–10h |
| Technical deep-dive | 12–16 SOL | 4–6h |
| Full product launch | 60–100 SOL | 12–24h |
| On-chain treasury op | 2–4 SOL | 30–60min |

If a mission runs out of budget before completing, the orchestrator pauses execution and sends a delegation event asking for budget extension. You can approve or cancel from the Mission Detail page.

---

## Seeding Memory Before You Start

The single biggest quality multiplier is pre-seeded memory. Agents that start with context produce dramatically better outputs than agents starting cold.

Before your first real mission, run a dedicated "context seeding" mission:

```
Mission: Context seeding
Objective: Store the following context in shared memory for use by future missions:
  1. Company background: [paste your company description]
  2. Target audience: [paste ICP definition]
  3. Brand voice: [paste style guidelines]
  4. Competitive landscape: [paste competitor analysis]
  5. Product context: [paste product description]
Agents: Research (to embed and organize)
Budget: 2 SOL
```

Or seed directly via the API (fastest):

```typescript
const chunks = [
  { text: "Company: ...", tags: ["context", "company"] },
  { text: "Brand voice: ...", tags: ["context", "brand"] },
  { text: "Target audience: ...", tags: ["context", "audience"] },
];

for (const chunk of chunks) {
  await fetch("/api/memory/upsert", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...chunk, missionId: null }),
  });
}
```

---

## Monitoring Live Missions

### Live Console (`/console`)

The Live Console streams every agent's reasoning in real time. It's the most detailed view — each agent logs what it's doing, what tools it's calling, and what confidence it has in its outputs.

**When to watch:**
- When a mission is running and something seems stuck (look for repeated error events)
- When you want to understand how agents are interpreting your objective
- When you want to spot a low-confidence step before it completes

### Mission Detail (`/missions/:id`)

The task tree view shows the full decomposition from Strategy Agent — all stages, tasks, dependencies, and current status. This is the best view for understanding mission structure.

**When to watch:**
- After a mission is created, to verify the task decomposition makes sense
- When a milestone completes, to see which tasks are next
- When something fails, to trace which task and which agent is responsible

### Dashboard (`/dashboard`)

The mission feed gives a live percentage progress bar and a recent activity stream. Good for a quick status check without the detail of the console.

---

## Interpreting Agent Output

### Trust scores as signal

An agent with `trustScore < 70` is executing a task outside its typical performance zone — either the task is too broad, the context is poor, or the model is struggling. Check the Live Console when you see low-confidence events.

### Memory relevance scores

When querying memory, results with `relevance < 0.7` are loosely related — treat them as background context, not authoritative sources. Results with `relevance > 0.9` are highly relevant and can be cited directly.

### Strategy Agent confidence

At mission creation, Strategy Agent outputs a `confidence` estimate. Below 65%, it's flagging ambiguity in your objective. Read the decomposition carefully and look for vague tasks — you may want to cancel, refine your objective, and restart.

---

## Cost Optimization

### Use Groq for low-latency tasks

Add `GROQ_API_KEY` to your backend `.env`. Groq runs Llama 3 at sub-100ms response times at very low cost. The orchestrator uses it as a fallback for Coordination and Analytics agent tasks where model capability matters less than throughput.

### Lower `executionSpeedPct` for quality

Setting `executionSpeedPct: 40` makes agents run sequentially and review each other's outputs. This produces noticeably higher quality but takes 2–3x longer. Worth it for final deliverables, not for exploratory missions.

### Reuse memory across missions

Memory stored from one mission is available to all future missions. Don't re-research the same topic twice — run a `POST /api/memory/query` before creating a new mission to see if the answer already exists in your knowledge base.

### Monitor burn rate in the Treasury page

The Treasury dashboard shows real-time SOL burn rate per mission. If a mission is burning budget too fast (e.g., `executionSpeedPct: 100` with large objectives), you can pause it from the Mission Detail page and adjust the scope.

---

## Common Pitfalls

### Too many agents for a narrow task
Running 5 agents on a task that only needs Research + Design wastes ~60% of the budget on agents that have nothing meaningful to contribute. Match agent count to actual domain coverage needed.

### No shared memory enabled
If `sharedCrossAgentMemory: false`, agents can't read each other's findings. Research Agent's competitive analysis won't reach Design Agent's copy. Always leave this `true` unless you have a specific reason to isolate.

### Objective with no deliverable format
"Research marketing strategies" gives agents no target artifact. Add: "Output a 3-page competitive analysis with a recommendation matrix and 5 actionable tactics." Agents plan backwards from deliverables.

### Not watching the Live Console on the first run
The first mission with a new objective is always the most important to monitor. Agents interpret your objective and you may want to course-correct early. After the first mission completes, subsequent similar missions run more smoothly because memory is populated.

### Budget too low for complexity
A 6-SOL mission given a 50-page whitepaper objective will time out halfway through. Match budget to output volume. If unsure, start with the recommended budgets above and adjust based on your first run.
