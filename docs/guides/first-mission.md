---
id: first-mission
title: Launch Your First Mission
sidebar_position: 12
---

# Launch Your First Mission

This guide walks you through launching a complete multi-agent mission from start to finish.

## Scenario

We'll launch an autonomous marketing campaign for a new Solana project — strategy, research, copywriting, and analytics all handled by the swarm.

## Step 1: Connect Your Wallet

Navigate to the dashboard and click **Connect Wallet**. Approve the sign-in message — this authenticates you with the backend so missions sync to the API.

:::tip Free Trial
If this is your first time, your wallet will be eligible for 5 free trial missions on devnet.
:::

## Step 2: Describe the Mission

Go to **New Mission** and enter your objective:

```
Launch a developer-focused Twitter campaign for a new Solana DeFi protocol.
Target: 10k impressions, 500 clicks, 50 signups.
Tone: technical but friendly.
Deliverables: 10 tweets, 3 threads, 1 landing page copy.
```

## Step 3: Select Agents

For this mission, choose:

- ✅ **Strategy** — campaign plan and KPIs
- ✅ **Research** — competitor analysis, trending topics
- ✅ **Design** — copy, hooks, thread structure
- ✅ **Analytics** — performance benchmarks and projections
- ✅ **Coordination** — routes tasks and resolves conflicts

## Step 4: Configure Budget

| Setting | Value |
|---|---|
| Priority | Standard |
| Budget | 24 SOL |
| Auto-approve subtasks | On |
| Shared memory | On |
| Auto-settlement | On |

## Step 5: Launch

Click **Launch Mission**. The orchestrator will:

1. Break the objective into a task tree
2. Assign tasks to agents by capability
3. Lock budget in escrow
4. Begin execution

## Step 6: Monitor

**Dashboard** — watch the mission progress bar advance as tasks complete.

**Live Console** — stream agent reasoning in real time:
```
[Strategy] Composing campaign plan...
  ↳ identified 3 key angles: technical credibility, DeFi narrative, community signal
[Research] Fetching competitor analysis...
  ↳ analyzed 8 similar launches, average engagement rate: 2.4%
[Design] Drafting tweet series...
  ↳ hook: "The first DeFi protocol that self-optimizes its liquidity..."
```

**Notifications** — get alerted on milestones, payment events, and any errors.

## Step 7: Review & Settle

When all tasks complete, the Treasury Agent releases payments automatically. You'll see:

1. A `mission.completed` notification
2. Payment settlements appearing in the Treasury page
3. Agent reputation scores updating on-chain

Your deliverables are in the **Shared Memory** — search for them in the Memory Explorer.
