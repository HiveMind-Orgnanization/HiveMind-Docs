---
id: overview
title: Agent Types
sidebar_position: 4
---

# Agent Types

HiveMind ships 7 built-in specialized agent types. Each owns a distinct domain, is powered by a specific LLM, and communicates through the shared orchestration bus. Agents run concurrently, delegate to each other, and write results to shared Qdrant memory.

---

## Core Agents

### Strategy Agent
**Model:** Claude Opus 4.7 &nbsp;·&nbsp; **Color:** `#22d3ee` (cyan) &nbsp;·&nbsp; **Trust level:** Highest

The mission planner — the first agent activated on every mission. It reads your objective and produces a complete execution blueprint before any other agent starts work.

**Outputs:**
- Decomposed task tree with dependencies and stage gates
- KPI definitions and measurable success metrics
- Delegation plan (which tasks go to which agents in what order)
- Confidence estimate (0–100%) and timeline projection
- Risk flags (scope ambiguity, resource constraints, deadline pressure)

**Behavior:** Strategy Agent is the only agent allowed to modify mission scope (`modify_mission_scope` permission). It re-plans when other agents report blockers or when the orchestrator detects significant drift from the original plan.

---

### Research Agent
**Model:** GPT-4o &nbsp;·&nbsp; **Color:** `#a855f7` (purple)

Deep information gathering for any topic the mission requires. Research Agent uses web search tools, synthesizes large volumes of text, and writes structured findings to shared memory for other agents to build on.

**Capabilities:**
- Web search and multi-source synthesis
- Competitive and market analysis
- Data retrieval, cleaning, and summarization
- Citation tracking with source confidence scores
- Cross-mission memory recall ("what did we learn about X last quarter?")

**Example output stored in memory:**
```
[Research:mem-1042] Solana DeFi TVL reached $4.2B in Q1 2026, up 180% YoY.
Top protocols: Raydium (38%), Orca (22%), Drift (14%). Sources: DeFiLlama, Messari.
Confidence: 0.91
```

---

### Design Agent
**Model:** GPT-4o + DALL-E 3 &nbsp;·&nbsp; **Color:** `#3b82f6` (blue)

Creative execution layer. Design Agent handles all copywriting, content generation, and brand-consistent output across text and image formats.

**Capabilities:**
- Long-form copywriting: landing pages, pitch decks, whitepapers, ad copy
- Social content: tweet threads, LinkedIn posts, Discord announcements
- Image generation briefs for DALL-E 3 and Midjourney
- Brand voice consistency enforcement (reads style guidelines from memory)
- A/B variant generation for marketing experiments

**Design Agent reads brand guidelines from memory** — if your Research Agent stores style rules or previous campaign assets, Design Agent will automatically apply them without re-prompting.

---

### Treasury Agent
**Model:** Claude Haiku 4.5 &nbsp;·&nbsp; **Color:** `#10b981` (green) &nbsp;·&nbsp; **Trust level:** Highest

Financial operations and on-chain settlement. Treasury Agent is the only agent with authority to sign Solana transactions.

**Capabilities:**
- Escrow locking (`lock_escrow`) when a mission starts
- Milestone release (`release_milestone`) as tasks complete
- Mission settlement (`settle_mission`) on completion
- Budget burn rate analysis and overspend alerting
- Multi-sig coordination for amounts above threshold (default: 50 SOL)
- Refund routing (unused budget → creator wallet)

**Security model:** Treasury Agent's signing keypair is stored in the backend's HSM-equivalent environment. It only signs transactions that the orchestrator has cryptographically authorized through a two-step approval flow.

---

### Coordination Agent
**Model:** GPT-4o-mini &nbsp;·&nbsp; **Color:** `#06b6d4` (light cyan)

The backbone of multi-agent communication. Coordination Agent runs continuously throughout a mission, managing message routing between agents and resolving conflicts when parallel workers produce conflicting results.

**Capabilities:**
- Inter-agent message routing and fan-out
- Conflict resolution when two agents produce contradictory outputs
- Realtime status aggregation → WebSocket broadcast
- Delegation conflict detection (prevents duplicate work)
- Stale agent detection and re-assignment

**Coordination Agent is invisible to users** — it operates entirely in the background and only appears in the Live Console as routing events.

---

### Analytics Agent
**Model:** DeepSeek v3 &nbsp;·&nbsp; **Color:** `#8b5cf6` (violet)

Data intelligence layer. Analytics Agent measures everything — workflow efficiency, agent performance, mission ROI — and surfaces actionable insights in the Analytics dashboard.

**Capabilities:**
- Workflow efficiency metrics (task completion rate, time-per-task, blockers)
- Agent performance benchmarking across missions
- Mission ROI analysis (SOL spent vs. estimated output value)
- Anomaly detection in execution pipelines
- Trend analysis over historical mission data

**Analytics Agent writes structured JSON reports to memory** that are surfaced on the `/analytics` dashboard.

---

### Development Agent
**Model:** DeepSeek v3 (code-optimized) &nbsp;·&nbsp; **Color:** `#0ea5e9` (sky blue)

Code execution and automation. Development Agent generates, reviews, and tests code artifacts as part of a mission. Useful for missions that require API integrations, automation scripts, or prototype implementations.

**Capabilities:**
- TypeScript/Python/Rust code generation
- API integration scaffolding and boilerplate
- Test suite generation (unit + integration)
- Deployment scripting (Docker, CI/CD configs)
- Code review and security audit

**Note:** Development Agent does not execute code directly in production — it generates artifacts that a human engineer reviews and deploys. Sandboxed execution for non-destructive scripts is on the roadmap.

---

## Agent Lifecycle

```
Mission Created
      │
      ▼
Strategy Agent decomposes into task tree
      │
      ▼
Orchestrator assigns tasks to agent workers
      │
      ▼
Agents enter QUEUED state (Redis task queue)
      │
      ▼
Agent worker picks up task → RUNNING state
      │
      ├── Reads from Qdrant shared memory (context)
      ├── Executes task (LLM call + tool use)
      ├── Writes results to Qdrant shared memory
      ├── Emits completion event → WebSocket bus
      └── Returns result to orchestrator
              │
              ▼
      Orchestrator updates task tree
              │
              ├── All milestone tasks done?
              │   └── Treasury Agent releases payment
              └── All tasks done?
                  └── Mission → SETTLING → COMPLETED
```

### Agent States

| State | Description |
|---|---|
| `idle` | Registered, waiting for task assignment |
| `queued` | Task assigned, waiting in Redis queue |
| `running` | Actively executing a task |
| `paused` | Waiting for human approval or peer output |
| `error` | Task failed; orchestrator may retry or re-assign |
| `offline` | Agent worker process is unreachable |

---

## Trust Score & Reputation

Each agent accumulates a `trustScore` (0–100) that's stored on-chain in an `AgentReputation` PDA. The score gates task assignment — higher-trust agents receive more complex, higher-budget tasks.

**Score formula:**

```
trustScore = (reputation / 5.0) * 100 * recencyMultiplier

reputation = weighted_average(
  task_completion_rate * 0.40,
  output_quality_score * 0.30,
  on_time_delivery     * 0.20,
  delegation_accuracy  * 0.10
)
```

| Factor | Weight | Measurement |
|---|---|---|
| Task completion rate | 40% | Tasks finished ÷ tasks assigned |
| Output quality score | 30% | Peer-review score from orchestrator |
| On-time delivery | 20% | Completion before deadline |
| Delegation accuracy | 10% | Sub-task quality when agent delegates |

Trust scores are updated on-chain after every mission via the `update_reputation` instruction, signed by the Treasury Agent.

---

## Permissions Matrix

Each agent type has default permissions configurable in **Settings → Agent Permissions**:

| Capability | Strategy | Research | Design | Treasury | Coordination | Analytics | Development |
|---|---|---|---|---|---|---|---|
| Delegate to peers | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| Modify mission scope | ✓ | — | — | — | ✓ | — | — |
| Read shared memory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Write shared memory | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Approve payouts | — | — | — | ✓ | — | — | — |
| Sign on-chain txs | — | — | — | ✓ | — | — | — |
| Generate code artifacts | — | — | — | — | — | — | ✓ |
| Access Analytics data | — | — | — | — | — | ✓ | — |

---

## Adding Agents to a Mission

Select agents at mission creation time. You can combine any subset:

```typescript
POST /api/missions
{
  "agents": ["Strategy", "Research", "Design", "Analytics"],
  "budget": 24,
  ...
}
```

**Recommended combinations:**

| Use case | Agent team |
|---|---|
| Market research | Research + Analytics + Strategy |
| Marketing campaign | Strategy + Research + Design + Analytics |
| Product launch | All 7 agents |
| Technical prototype | Strategy + Development + Research |
| Treasury operations | Treasury + Analytics + Coordination |

---

## Custom Agents

You can build and deploy custom agents to the HiveMind Marketplace. See the [Custom Agents guide](../guides/custom-agent) for implementation details, the `BaseAgent` class API, and marketplace listing requirements.
