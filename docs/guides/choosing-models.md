---
id: choosing-models
title: Choosing Models
sidebar_position: 3
---

# Choosing Models

Every agent in a mission has a model. The defaults are sane, but you can override per-agent in the Mission Create wizard. This guide explains what's available, what's enabled today, and how the backend actually routes the call.

---

## Defaults

| Agent | Default Model | Tier |
|---|---|---|
| Strategy | GPT-4o | standard |
| Research | DeepSeek v3 | standard |
| Design | GPT-4.1 | standard |
| Development | Llama 4 70B | standard |
| Marketing | Llama 4 70B | standard |
| Treasury | Mixtral 8x22B | standard |
| Analytics | DeepSeek v3 | standard |
| Coordination | GPT-4.1 | standard |
| Memory | GPT-4o mini | light |

Defaults change with the mission priority tier:

| Tier | Model defaults |
|---|---|
| `low` | All roles → `gpt-4o-mini` (light tier — cheapest) |
| `std` | Per-role headline (varied — table above) |
| `high` | Promoted within standard tier (e.g. Development → `gpt-5-mini`, Strategy → `gpt-4.1`) |
| `crit` | Top of the standard tier — premium not used (premium is "Soon") |

---

## Full Model Catalog

Defined in [`src/lib/agent-models.ts`](https://github.com/HiveMind-Orgnanization/HiveMind-Frontend/blob/master/src/lib/agent-models.ts):

### Light tier (enabled)
| Model id | Display | Cost multiplier |
|---|---|---|
| `gpt-4o-mini` | GPT-4o mini | 1.0× |
| `gpt-4.1-mini` | GPT-4.1 mini | 1.1× |
| `gpt-5-nano` | GPT-5 nano | 1.2× |

### Standard tier (enabled)
| Model id | Display | Cost multiplier |
|---|---|---|
| `gpt-4o` | GPT-4o | 1.4× |
| `gpt-4.1` | GPT-4.1 | 1.6× |
| `gpt-5-mini` | GPT-5 mini | 1.8× |
| `llama-4-70b` | Llama 4 70B | 1.6× |
| `mixtral-8x22b` | Mixtral 8x22B | 1.4× |
| `deepseek-v3` | DeepSeek v3 | 1.5× |

### Reasoning tier (Soon)
| Model id | Display | Cost multiplier |
|---|---|---|
| `o1-mini` | o1 mini | 2.0× |
| `o3-mini` | o3 mini | 2.4× |
| `llama-4-405b` | Llama 4 405B | 3.0× |

### Premium tier (Soon)
| Model id | Display | Cost multiplier |
|---|---|---|
| `o1` | o1 | 3.2× |
| `o3` | o3 | 4.0× |
| `gpt-5.1` | GPT-5.1 | 5.0× |
| `gpt-5.5` | GPT-5.5 | 5.5× |
| `gpt-5.5-pro` | GPT-5.5 pro | 6.5× |
| `claude-4.7-sonnet` | Claude 4.7 Sonnet | 4.4× |
| `claude-4.7-opus` | Claude 4.7 Opus | 6.0× |
| `gemini-2.5-pro` | Gemini 2.5 Pro | 4.6× |

The cost multiplier drives the SOL cost ladder you see on the Mission Create budget slider — higher multiplier = more SOL for the same amount of work.

---

## What's Enabled Today

Only **light** and **standard** tier models are selectable. Reasoning and premium models render with a "Soon" badge in the dropdown and are disabled — selecting one shows a toast and reverts to the previous choice.

This is a deliberate hackathon-stage choice. Premium models have higher latency and higher cost, both of which hurt the demo. Once the protocol moves to mainnet with paid users, the reasoning/premium tiers will unlock.

---

## How the Backend Actually Routes

> **Important:** The model id you pick in the UI is **stored** with the mission (`mission.config.agentModels[role]`) and **displayed** on the dashboard and agent cards — but the backend currently routes every agent call through a single environment variable, `OPENAI_MODEL_ALL`.

Today that variable is set to `gpt-5.5`. Every agent call — Strategy, Research, Development, etc. — goes to OpenAI's `gpt-5.5` model regardless of what the UI shows.

This is a transitional architecture. The UI advertises HiveMind's multi-vendor routing story (Claude, Llama, Mixtral, DeepSeek, Gemini, GPT-5.5) because that's the roadmap; the backend hasn't wired up the non-OpenAI providers yet. Once it does, the model id from `agentModels[role]` will route to the correct provider.

**What this means for you:**
- Cost estimates on the Mission Create page use the displayed model's multiplier — so a Llama 4 70B mission shows a different SOL price than a GPT-5.5 mission, even though both end up on `gpt-5.5` server-side
- Quality is uniform across model choices today (all gpt-5.5)
- The model dropdown is "real" in the sense that the choice persists and displays everywhere — it's just routed to one backend model for now

See [`hivemind-backend/src/services/agent-runtime.ts`](https://github.com/HiveMind-Orgnanization/HiveMind-Backend/blob/master/src/services/agent-runtime.ts) for the routing logic.

---

## Picking Models for a Mission

### Default flow

Just leave the dropdowns alone. The per-role defaults are tuned for the priority tier you picked, and they're all enabled (light + standard).

### Per-agent override

Click the model name next to any agent in the **Agent Roster** section. A dropdown shows all catalog entries, grouped by tier. Reasoning and premium tiers render with a "Soon" badge and are disabled.

### Per-priority override

Change the priority tier at the top of the wizard (`low` / `std` / `high` / `crit`) and the per-role defaults re-populate. Your manual overrides are reset when you change tier — by design, so you don't carry a Llama 4 405B selection from `crit` down to `low` accidentally.

---

## Special Behavior — Codegen Roles

For roles that write code (Development, occasionally Coordination), the backend adds `reasoning_effort: "none"` to the OpenAI request. This:

- Cuts reasoning-token spend from ~30% of the response to 0%
- Speeds up generation ~4×
- Produces no quality loss for code tasks (verified during the hackathon)

This optimization is hard-coded for codegen roles — you can't toggle it. If you build your own agent, you control whether to inherit this setting in `agent-runtime.ts`.

---

## Adding a New Model

To add a model to the dropdown, edit `src/lib/agent-models.ts`:

```typescript
{ id: "your-model-id", label: "Your Model", desc: "Short description", solMult: 1.7, tier: "standard" },
```

Then in `src/lib/agent-models.ts`'s `ROLE_HEADLINE_MODEL`, optionally assign it as a default for a specific role.

To make the backend actually route to your model, add a case in [`hivemind-backend/src/services/agent-runtime.ts`](https://github.com/HiveMind-Orgnanization/HiveMind-Backend/blob/master/src/services/agent-runtime.ts) that maps the model id to the correct provider's SDK call.

---

## Common Issues

### "This model is coming soon" toast
You clicked on a reasoning or premium tier model. Pick from light or standard.

### Cost estimate doesn't match expectations
Cost is `priority_base × Σ (agent_count × solMult)`. Adding agents or upgrading models scales it linearly.

### Per-agent model not showing on dashboard
The dashboard reads `mission.config.agentModels[role]` and falls back to the per-role headline default if the stored value is missing or the legacy `"gpt-5.5"` uniform default. If you see a different model than you picked, check `localStorage.getItem("hm-missions:" + walletPk)` and inspect the mission's config.

---

## Next

- **[Live Preview →](./live-preview)** — see Development's model in action
- **[Agent Types →](../agents/overview)** — role contracts per agent
- **[Missions →](../missions)** — full lifecycle
