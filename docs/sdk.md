---
id: sdk
title: SDK & Integration
sidebar_position: 11
---

# SDK & Integration

HiveMind can be integrated into any TypeScript or JavaScript application via the REST API. An official SDK package is in development.

---

## Using the REST API Directly

The simplest integration is calling the REST API with `fetch`. Here's a complete typed client you can drop into any project:

```typescript
// hivemind-client.ts

const BASE_URL = process.env.HIVEMIND_API_URL ?? "http://localhost:8787";

export class HiveMindClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HiveMind API error: ${res.status}`);
    return res.json();
  }

  // Missions
  async getMissions() {
    return this.request<Mission[]>("GET", "/api/missions");
  }

  async createMission(data: CreateMissionInput) {
    return this.request<Mission>("POST", "/api/missions", data);
  }

  async getMission(id: string) {
    return this.request<Mission>("GET", `/api/missions/${id}`);
  }

  // Memory
  async queryMemory(query: string, topK = 8) {
    return this.request<MemoryQueryResult>("POST", "/api/memory/query", { query, topK });
  }

  async upsertMemory(text: string, tags: string[], missionId?: string) {
    return this.request("POST", "/api/memory/upsert", { text, tags, missionId: missionId ?? null });
  }

  // Reputation
  async getLeaderboard(limit = 20) {
    return this.request<AgentReputation[]>("GET", `/api/reputation/leaderboard?limit=${limit}`);
  }
}
```

---

## Types

```typescript
// types.ts

export type MissionPriority = "low" | "standard" | "high" | "critical";
export type MissionStatus = "pending" | "active" | "settling" | "completed" | "failed";
export type AgentType =
  | "Strategy" | "Research" | "Design" | "Treasury"
  | "Coordination" | "Analytics" | "Development";

export interface MissionConfig {
  delegationPct?: number;          // 0–100, default 70
  executionSpeedPct?: number;      // 0–100, default 80
  collaborationPct?: number;       // 0–100, default 75
  autoApproveSubtasks?: boolean;   // default true
  sharedCrossAgentMemory?: boolean;// default true
  autoOnChainSettlement?: boolean; // default true
  deadlineIso?: string;            // ISO 8601
}

export interface CreateMissionInput {
  title: string;
  objective: string;
  priority: MissionPriority;
  agents: AgentType[];
  budget: number;                  // SOL
  config?: MissionConfig;
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: MissionStatus;
  priority: MissionPriority;
  progress: number;               // 0–100
  agents: AgentType[];
  budget: number;
  cost: number;
  config: MissionConfig;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryMatch {
  id: string;
  text: string;
  relevance: number;              // 0–1
  missionId: string | null;
  agentType: AgentType;
  tags: string[];
  createdAt: string;
}

export interface MemoryQueryResult {
  query: string;
  matches: MemoryMatch[];
}

export interface AgentReputation {
  id: string;
  name: string;
  agentType: AgentType;
  reputation: number;             // 0–5
  trustScore: number;             // 0–100
  missionsCompleted: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Hexagon";
}
```

---

## Authentication

Get a session token by signing a message with your Solana wallet:

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

async function getHiveMindToken(
  walletPublicKey: PublicKey,
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `HiveMind sign-in: ${timestamp}`;
  const encodedMessage = new TextEncoder().encode(message);

  const signature = await signMessage(encodedMessage);

  const res = await fetch(`${BASE_URL}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet: walletPublicKey.toBase58(),
      signature: bs58.encode(signature),
      message,
    }),
  });

  const { token } = await res.json();
  return token;
}
```

In a React app with `@solana/wallet-adapter-react`:

```typescript
import { useWallet } from "@solana/wallet-adapter-react";

function useHiveMindAuth() {
  const { publicKey, signMessage } = useWallet();

  const authenticate = async () => {
    if (!publicKey || !signMessage) return null;
    const token = await getHiveMindToken(publicKey, signMessage);
    localStorage.setItem("hm_token", token);
    return new HiveMindClient(token);
  };

  return { authenticate };
}
```

---

## WebSocket Integration

Subscribe to real-time agent events from any environment:

```typescript
// ws-client.ts

export class HiveMindRealtimeClient {
  private ws: WebSocket;
  private handlers: Map<string, ((event: any) => void)[]> = new Map();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      this.send({ action: "subscribe", channel: "global" });
    };
    this.ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      const handlers = this.handlers.get(event.type) ?? [];
      handlers.forEach((h) => h(event.payload));
    };
  }

  on(eventType: string, handler: (payload: any) => void) {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
    return this;
  }

  private send(data: object) {
    this.ws.send(JSON.stringify(data));
  }

  subscribe(channel: string) {
    this.send({ action: "subscribe", channel });
    return this;
  }

  close() {
    this.ws.close();
  }
}

// Usage:
const rt = new HiveMindRealtimeClient("ws://localhost:8787/ws");
rt
  .subscribe("execution")
  .on("agent.activity", (payload) => {
    console.log(`[${payload.agentType}] ${payload.message}`);
  })
  .on("payment.settled", (payload) => {
    console.log(`Payment: ${payload.amountSol} SOL settled — tx: ${payload.txSignature}`);
  });
```

---

## On-chain Integration

Interact with the Solana program using `@coral-xyz/anchor`:

```typescript
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import idl from "./hivemind_idl.json";

const PROGRAM_ID = new PublicKey("EV447FY9Q7Ty7pFo8wDPFRhkqASmj87GZjFr8CPjQ5om");

function getProgram(wallet: any) {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const provider = new AnchorProvider(connection, wallet, {});
  return new Program(idl as any, provider);
}

// Fetch trial status
async function getTrialStatus(walletAddress: PublicKey) {
  const program = getProgram(/* wallet adapter */);

  const [userTrialPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_trial"), walletAddress.toBuffer()],
    PROGRAM_ID
  );

  try {
    const account = await program.account.userTrial.fetch(userTrialPda);
    return {
      registered: true,
      usesRemaining: account.usesRemaining,
      lastClaimAt: account.lastClaimAt.toNumber(),
    };
  } catch {
    return { registered: false, usesRemaining: 0 };
  }
}

// Register a new wallet for the trial
async function registerUser(wallet: any) {
  const program = getProgram(wallet);

  const [freeTrialConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("free_trial_config")],
    PROGRAM_ID
  );

  const [userTrial] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_trial"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );

  await program.methods
    .registerUser()
    .accounts({
      user: wallet.publicKey,
      userTrial,
      freeTrialConfig,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
}
```

---

## Planned SDK (`@hivemind-protocol/sdk`)

The official SDK package is currently in development and will wrap all of the above:

```typescript
import { HiveMind } from "@hivemind-protocol/sdk";

const hm = new HiveMind({
  apiUrl: "https://api.hivemind.so",
  wsUrl: "wss://api.hivemind.so/ws",
  wallet: solanaWalletAdapter,
});

await hm.auth.signIn();

const mission = await hm.missions.create({
  title: "Autonomous marketing campaign",
  objective: "...",
  agents: ["Strategy", "Research", "Design"],
  budget: 24,
});

hm.realtime
  .on("agent.activity", console.log)
  .on("mission.completed", async (e) => {
    const results = await hm.memory.query({ query: "campaign deliverables", missionId: e.missionId });
    console.log(results);
  });

const leaderboard = await hm.reputation.leaderboard({ limit: 10 });
```

To get notified when the SDK is published, follow the [HiveMind GitHub](https://github.com/hivemind-protocol).

---

## Copying helpers from the frontend

The frontend's `src/lib/api.ts` contains typed, production-ready API helpers. You can copy them directly into any TypeScript project — they're framework-agnostic and have no React dependencies.

Key exports:
- `fetchMissions()` — list all missions
- `createMission(data)` — create a mission
- `fetchTrialStatus(wallet)` — on-chain trial status
- `queryMemory(query, topK)` — semantic memory search
- `fetchPayments(missionId?)` — payment history
- `fetchLeaderboard(limit?)` — reputation leaderboard
