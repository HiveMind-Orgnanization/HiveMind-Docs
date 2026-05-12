---
id: efficient-usage
title: Using HiveMind Efficiently
sidebar_position: 10
---

# Using HiveMind Efficiently

Tactics for getting the most out of HiveMind — both in terms of SOL spent and time to a working artifact. Everything here is grounded in how the system actually works today, not hypothetical optimizations.

---

## Write a prompt the swarm can run with

The biggest lever is the prompt. The swarm runs better when you give it:

- **A clear deliverable.** "Build a Solana NFT minting landing page" beats "make me something cool for my project."
- **One or two structural anchors.** "— hero, gallery, mint button" tells Design which sections to spec.
- **Domain context if it's non-obvious.** "Solana NFT" already implies wallet adapter + mint; if you want something less common (token-gated, ZK-proof'd, etc.), say so.

### Good prompts

```
Build a Solana NFT minting landing page — hero, gallery, mint button.
```

```
Design a pitch deck for a developer-tools startup. 10 slides, dark mode, code samples on slides 4–6.
```

```
Research Solana DeFi protocols launched in Q1 2026. Market share, TVL trends, and growth metrics. Tabular output.
```

### Bad prompts

```
Help me with my project
```

```
Make it look professional
```

```
Build something cool with AI
```

The swarm will still run, but it'll spend most of its budget guessing at what you meant.

---

## Pick the right priority tier

The four tiers drive both the default agent roster and the budget. Choosing the right one saves you SOL.

| Tier | When to use | Default agents | Budget |
|---|---|---|---|
| `low` | Quick experiment, one-shot test | Strategy, Development, Treasury | 1.5 SOL |
| `std` | Most "build me X" missions | + Research, Coordination | 3.5 SOL |
| `high` | Production-quality with marketing copy | + Design, Marketing | 6 SOL |
| `crit` | Pitch-ready, every angle covered | + Analytics, Memory | 9 SOL |

If you're just testing the swarm, **start with `std`**. The default Strategy / Research / Development / Treasury / Coordination roster is enough for almost any code mission.

You can change the priority mid-wizard without losing your prompt — the agent roster repopulates but everything else stays.

---

## Drop agents you don't need

The Mission Create wizard lets you uncheck individual agents. Every agent you remove cuts cost by `agent_count × model_solMult × priority_base`.

Common removals:

- **Memory** — useful only when you plan to chain follow-up missions on the same context
- **Analytics** — overkill for one-off builds; useful for actual product work
- **Marketing** — drop if you don't need copy
- **Treasury** — keep it on; it's cheap and writes useful escrow notes

The minimum useful roster for a code mission is Strategy + Development + Coordination.

---

## Use lighter models when you can

The model dropdowns let you downshift any agent to a cheaper model. Defaults are tuned, but for casual work:

- **Memory + Coordination + Marketing** can almost always run on light tier (GPT-4o mini, GPT-4.1 mini)
- **Development** is the role where model quality matters most — keep it on standard tier or higher
- **Strategy + Research** can run on light tier for simple missions; bump to standard for complex protocol decisions

Reasoning and premium tiers are **disabled today** (Coming soon). Stick with light + standard.

See [Choosing Models →](./choosing-models) for the full catalog.

---

## Don't burn budget on follow-ups before mission settles

While the mission is `active`, every chat message you send dispatches a fresh swarm round. This is *expensive*. Wait for the mission to complete before iterating.

After completion:
- **5 free follow-up messages** per mission
- **0.05 SOL per message** thereafter

If you know you'll need lots of iterations, **launch a larger mission with clearer deliverables instead of a small one and 20 follow-ups**. The economics favor going big once over going small repeatedly.

See [Follow-up Paywall →](./follow-up-paywall).

---

## Batch related missions on the same wallet

The on-chain reputation PDA is keyed per agent pubkey, not per wallet — so you don't get a "loyalty discount" for using HiveMind a lot. But:

- Missions on the same wallet share the per-wallet `localStorage` and backend mission table — you can reference past mission artifacts in your prompt ("build a landing page that matches the design from mission M-242")
- The funder wallet sponsors free-trial registration once per wallet — switching wallets means losing the trial credits

Stay on one wallet unless you have a real reason to switch.

---

## Use the layout toggle

The Agent Workspace has three layouts: Chat-only, Split, Code-only. Plus a fullscreen mode.

- **Chat-only** while waiting for early agents (Strategy / Research) — preview isn't bundleable yet
- **Split** once Development starts saving files — watch both the chat and the preview
- **Code-only** when you want to read what was generated without distraction
- **Fullscreen** for demos or when the sidebar is in the way

Hotkey: there's no hotkey for layout switching yet (good first issue if you want to contribute).

---

## Watch the coordination graph

The graph in the corner of the workspace (and on the Dashboard) visualizes role transitions in real time. If you see one agent stuck in "thinking" for >2 minutes, something's wrong:

- Refresh the page (the polling re-evaluates the artifact tree)
- Check the backend logs for an OpenAI error
- If `OPENAI_MODEL_ALL=gpt-5.5` is invalid (model not found), every call 404s silently — verify with `curl https://api.openai.com/v1/models` against your key

---

## Use the Accelerate button

If the swarm seems to be moving slowly (sequential agents instead of parallel), click **Accelerate** in the Dashboard. This kicks off a fresh `swarm-run` that dispatches all pending agents in parallel.

The button is disabled when the mission is `completed`.

---

## Cap the budget

Even with `crit` priority, **10 SOL is the slider max**. There's no way to spend more on a single mission. If your mission feels too expensive at default settings:

1. Lower the priority tier
2. Drop optional agents (Marketing, Analytics, Memory)
3. Downshift model tiers
4. Tighten the prompt — vague prompts make the swarm spend more guessing

---

## Pre-fund the treasury for follow-ups

If you know you'll need follow-up edits after the mission settles, **deposit ~0.5 SOL into the treasury before launching**. The Deposit button on the Treasury page is faster than approving each 0.05 SOL paywall tx individually. (Future versions may credit a balance; today each paywall hit is a separate signature.)

See [Treasury Deposits →](./treasury-deposit).

---

## When the swarm fails

Common failure patterns and what to do:

| Symptom | Action |
|---|---|
| Preview stuck on "Building your preview…" past 10 min | Refresh. If still stuck, Development hasn't produced `package.json` + entry — relaunch the mission with a clearer prompt |
| Auto-fix loop runs 5 times and gives up | Send a follow-up message with the specific error and ask Development to fix it manually |
| Agent says "I can't help with that" | Your prompt triggered a safety filter — rephrase |
| Mission stuck at 80% progress | Some non-code agent is hanging. Pause + Resume sometimes unblocks; otherwise launch a new mission |
| Wallet balance drops but mission doesn't appear | The on-chain funding succeeded but the backend mission insert failed. Check backend logs; refresh; if the mission isn't in the dashboard, you can manually `settle_mission` to recover the SOL |

---

## What doesn't help

- **Re-sending the same prompt.** If the swarm failed once, it'll fail the same way unless you change what you give it.
- **Adding more agents.** More agents = more cost without proportional quality gain. Defaults are tuned.
- **Switching wallets mid-mission.** You'll lose the mission state — it's scoped per-wallet.

---

## Next

- **[First Mission →](./first-mission)** — walk through your first run
- **[Choosing Models →](./choosing-models)** — model-level cost levers
- **[Treasury Deposits →](./treasury-deposit)** — pre-fund the treasury for follow-ups
- **[Follow-up Paywall →](./follow-up-paywall)** — what you pay per extra message
