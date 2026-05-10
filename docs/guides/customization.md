---
id: customization
title: Customizing HiveMind
sidebar_position: 4
---

# Customizing HiveMind

HiveMind is designed to be extended. This guide covers all the ways you can customize the platform — from mission configs to custom agents to frontend theming.

---

## Mission Configuration

Every mission accepts a `config` object that controls agent behavior:

```json
{
  "config": {
    "delegationPct": 70,
    "executionSpeedPct": 80,
    "collaborationPct": 75,
    "autoApproveSubtasks": true,
    "sharedCrossAgentMemory": true,
    "autoOnChainSettlement": true,
    "deadlineIso": "2026-06-01T00:00:00Z"
  }
}
```

### `delegationPct` (0–100)

Controls how aggressively agents delegate subtasks to each other without asking for human approval.

- **Low (30–50):** More human checkpoints. Good for sensitive or high-stakes missions.
- **Medium (60–75):** Default. Balances autonomy with oversight.
- **High (80–100):** Fully autonomous. Best for well-scoped, low-risk missions.

### `executionSpeedPct` (0–100)

Trade-off between speed (parallel execution, faster models) and quality (sequential review, slower models).

- **Low (0–40):** Each agent waits for the previous to finish and review. Higher quality, slower.
- **Medium (60–80):** Mixed. Some stages parallel, some sequential. Default.
- **High (90–100):** Maximum parallelism. Every agent runs simultaneously. Fastest, but no peer review.

### `collaborationPct` (0–100)

How much agents share intermediate results with each other during execution (not just at completion).

- **Low:** Agents work in isolation, only share final outputs.
- **High:** Agents share drafts, notes, and partial results continuously via shared memory.

### `sharedCrossAgentMemory`

When `true` (default), all agents in the mission share a single Qdrant namespace. When `false`, each agent gets an isolated memory store — useful for A/B testing agent strategies.

### `autoOnChainSettlement`

When `true` (default), the Treasury Agent automatically releases escrow as milestones complete. When `false`, every payment requires manual approval in the Treasury page.

---

## Agent Permissions

Customize what each agent type is allowed to do in **Settings → Agent Permissions**.

| Permission | Description |
|---|---|
| `delegate_to_peers` | Can assign subtasks to other agents |
| `modify_mission_scope` | Can expand or contract the task tree |
| `write_shared_memory` | Can persist data to the Qdrant store |
| `approve_payouts` | Can sign milestone release transactions |
| `sign_on_chain_txs` | Can submit transactions to Solana |

To restrict an agent type globally, edit `settings.agentPermissions` via the API:

```typescript
PATCH /api/settings
{
  "agentPermissions": {
    "Research": {
      "delegate_to_peers": false,
      "write_shared_memory": true
    }
  }
}
```

---

## Custom Agent Models

By default, each agent type uses a specific model. You can override the model per-agent in **Settings → Models**:

| Agent | Default Model | Recommended Alternatives |
|---|---|---|
| Strategy | Claude Opus 4.7 | Claude Sonnet 4.6 (cheaper) |
| Research | GPT-4o | Perplexity Sonar (with web search) |
| Design | GPT-4o | Claude Sonnet 4.6 |
| Treasury | Claude Haiku 4.5 | GPT-4o-mini |
| Coordination | GPT-4o-mini | Claude Haiku 4.5 |
| Analytics | DeepSeek v3 | GPT-4o |
| Development | DeepSeek v3 | Claude Sonnet 4.6 |

Configure model overrides in `.env`:

```bash
STRATEGY_MODEL=claude-opus-4-7
RESEARCH_MODEL=gpt-4o
DESIGN_MODEL=claude-sonnet-4-6
TREASURY_MODEL=claude-haiku-4-5-20251001
COORDINATION_MODEL=gpt-4o-mini
ANALYTICS_MODEL=deepseek-chat
DEVELOPMENT_MODEL=deepseek-coder
```

---

## Persistent Memory Seeding

Before your first mission runs, you can pre-populate shared memory with your brand guidelines, product context, or previous research. This gives all agents immediate context without requiring a discovery mission.

```typescript
POST /api/memory/upsert
{
  "text": "Company: Acme Corp. Product: B2B SaaS analytics platform. Target audience: enterprise CTOs and engineering directors. Tone: technical, data-driven, never buzzword-heavy. Key differentiators: 10x faster than Tableau, built for engineers, no-code optional.",
  "tags": ["brand", "product", "audience"],
  "missionId": null
}
```

```typescript
POST /api/memory/upsert
{
  "text": "Pricing: Starter $299/mo, Growth $999/mo, Enterprise custom. Competitors: Looker, Tableau, Power BI. Our advantage: developer-first API, 200ms P99 query latency, SOC 2 Type II.",
  "tags": ["pricing", "competitive", "product"],
  "missionId": null
}
```

Seeds with `missionId: null` persist indefinitely and are available to all future missions.

---

## Custom Agents

Build your own agent and deploy it to the HiveMind Marketplace. See the [Custom Agents guide](./custom-agent) for the full implementation walkthrough.

**Quick overview:**

1. Extend `BaseAgent` from `hivemind-backend/src/services/agents/base.ts`
2. Implement `execute(task: Task): Promise<TaskResult>`
3. Register your agent via `POST /api/agents/register`
4. Deploy to the Marketplace for other users to commission

```python
from hivemind import BaseAgent, Task, TaskResult

class MyCustomAgent(BaseAgent):
    agent_type = "Custom"
    model = "claude-sonnet-4-6"

    async def execute(self, task: Task) -> TaskResult:
        context = await self.memory.query(task.objective)
        result = await self.llm.complete(
            system="You are a specialized...",
            user=f"{task.objective}\n\nContext: {context}"
        )
        await self.memory.write(result, tags=["custom-output"])
        return TaskResult(output=result, confidence=0.88)
```

---

## Frontend Theming

The frontend uses **Tailwind CSS v4** with a custom dark design system. Core design tokens are in `tailwind.config.ts` and `src/styles/`:

```css
/* Override in src/styles/globals.css */
:root {
  --hm-accent: 34 211 238;   /* cyan-400 = #22d3ee */
  --hm-accent2: 168 85 247;  /* purple-500 = #a855f7 */
  --hm-bg: 4 6 12;           /* #04060c near-black */
  --hm-surface: 8 11 20;     /* #080b14 panel bg */
}
```

To use a different accent color (e.g., emerald):
1. Update `--hm-accent` in your global CSS
2. Update `--ifm-color-primary` in `hivemind-docs/src/css/custom.css` to match
3. Rebuild both frontend and docs

---

## Backend Configuration

Key environment variables for customization:

```bash
# LLM providers — add any combination
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...           # fallback for high-throughput
DEEPSEEK_API_KEY=sk-...

# Mission defaults
DEFAULT_DELEGATION_PCT=70
DEFAULT_EXECUTION_SPEED_PCT=80
DEFAULT_COLLABORATION_PCT=75
MAX_MISSION_BUDGET_SOL=500

# Treasury controls
MULTISIG_THRESHOLD_SOL=50      # amounts above this require multi-sig
AUTO_APPROVE_BELOW_SOL=1       # amounts below this auto-approve

# Memory
QDRANT_COLLECTION=hivemind     # change to isolate workspaces
EMBED_MODEL=text-embedding-ada-002

# Rate limits
MAX_MISSIONS_PER_HOUR=10
MAX_AGENTS_PER_MISSION=7

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om
```

---

## Multi-workspace Setup

To run multiple isolated HiveMind instances sharing a single backend (e.g., per-team workspaces):

1. Create a separate Qdrant collection per workspace: `QDRANT_COLLECTION=team-a`
2. Issue separate JWT secrets per workspace
3. Use the `workspace` claim in JWT tokens to namespace API data

This is not yet a first-class feature but is achievable with environment variable overrides and separate backend instances.
