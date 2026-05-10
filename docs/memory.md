---
id: memory
title: Memory System
sidebar_position: 6
---

# Memory System

HiveMind's memory system is a shared semantic vector store powered by **Qdrant** that lets every agent build on the swarm's collective context.

## How It Works

Every agent reads and writes to a shared Qdrant collection named `hivemind`. When an agent completes a task, it embeds its findings as dense vectors and stores them alongside metadata.

```
Agent completes research
        │
        ▼
Embed text → 1536-dim vector (OpenAI ada-002)
        │
        ▼
Upsert into Qdrant: { id, vector, payload }
  payload: { text, missionId, agentType, timestamp, tags }
        │
        ▼
Future agents query: "Find brand guidelines from last campaign"
        │
        ▼
Qdrant returns top-k nearest vectors → agent uses as context
```

## Memory Types

| Type | Description | Retention |
|---|---|---|
| **Episodic** | Task outputs, research findings, decisions | Per-mission |
| **Semantic** | Brand voice, style guides, recurring patterns | Persistent |
| **Procedural** | Workflow templates, agent playbooks | Persistent |
| **Working** | Active task context, in-flight reasoning | Session-only |

## Memory Explorer

The **Memory Explorer** (`/memory`) provides:

- **Semantic search** — query across all stored vectors with natural language
- **Cluster view** — knowledge grouped by topic (Brand, Strategy, Technical, etc.)
- **Timeline** — chronological view of memory writes
- **Source filtering** — filter by agent type or mission

### Searching Memory

```typescript
POST /api/memory/query

{
  "query": "marketing campaign performance metrics",
  "topK": 8,
  "filter": {
    "missionId": "m-247",
    "agentType": "Research"
  }
}
```

Response:
```json
{
  "query": "marketing campaign performance metrics",
  "matches": [
    {
      "id": "mem-1042",
      "text": "Campaign CTR reached 3.2% vs 1.8% benchmark...",
      "relevance": 0.94,
      "missionId": "m-247",
      "agentType": "Research",
      "createdAt": "2026-05-10T16:42:00Z"
    }
  ]
}
```

## Writing to Memory

Agents write automatically. You can also write via API:

```typescript
POST /api/memory/upsert

{
  "text": "Brand voice guidelines: technical but approachable...",
  "tags": ["brand", "voice", "guidelines"],
  "missionId": null  // null = persists across all missions
}
```

## Memory Security

- Memory is **workspace-scoped** — agents in one workspace cannot read another workspace's store
- `sharedCrossAgentMemory: false` in mission config creates an isolated store for that mission
- Sensitive financial data (wallet keys, amounts) is never embedded — Treasury Agent uses encrypted side-channels
