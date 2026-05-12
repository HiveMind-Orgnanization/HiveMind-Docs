---
id: live-preview
title: Live Preview & Self-Healing
sidebar_position: 4
---

# Live Preview & Self-Healing

When the Development agent writes code during a mission, HiveMind renders it as a **working interactive app** in the Agent Workspace's right pane. No deploy step, no "view this on CodeSandbox" link — the preview iframe boots in-place from the artifact tree.

When the preview throws a runtime error, an agent **catches it, reads the trace, and patches the code** — posting the diff back into the chat. No human in the loop.

This page explains both halves.

---

## The Sandpack Preview

The right pane of the Agent Workspace uses [Sandpack](https://sandpack.codesandbox.io/) to bundle and render the generated app entirely in the browser. No server-side build, no `npm install`, no deploy step.

### When the preview "wakes up"

The "Building your preview…" overlay stays until two specific files exist in the artifact tree:

1. `frontend/package.json` — defines dependencies + entry point
2. `frontend/src/main.tsx` *or* `frontend/src/App.tsx` — the React entry

The moment both exist, the overlay lifts and Sandpack starts bundling. Marketing, Treasury, Coordination, Analytics, and Memory agents can still be writing markdown narration in the chat — their output doesn't gate the preview because their output doesn't affect the build.

### What gets rendered

Sandpack rebuilds the iframe each time the artifact tree changes. The chosen entry point is `frontend/src/main.tsx` (Vite convention). Tailwind, `tailwind.config.js`, `postcss.config.js`, and any `frontend/src/**` files are all picked up automatically.

### Preview controls

The Code & Preview toolbar at the top of the right pane has three tabs:

| Tab | Shows |
|---|---|
| **Code** | The artifact file tree + selected file content |
| **Preview** | The live Sandpack iframe |
| **Split** | Code on the left, preview on the right (side-by-side) |

There's also a Layout toggle on the workspace header: **Chat-only / Split / Code-only**, plus a Maximize button that hides the sidebar and top nav.

---

## Self-Healing Build Loop

The biggest demo moment in HiveMind is the auto-fix. Here's exactly what happens when a generated app throws a runtime error.

### 1. Sandpack catches the error

When the preview iframe boots and React throws (e.g. an undefined component, a missing import, a null prop access), Sandpack surfaces the error to the `onErrors` callback. HiveMind silences Sandpack's default red error overlay (`showSandpackErrorOverlay={false}`) and shows a friendly amber overlay instead.

### 2. The error trace is matched against known patterns

`AgentWorkspace.tsx` has a `looksLikeFixableRuntimeError` regex that classifies errors as auto-fixable or not:

- ✅ "Cannot read properties of undefined"
- ✅ "is not a function"
- ✅ "Failed to compile"
- ✅ "Missing semicolon"
- ✅ "Unexpected token"
- ✅ "No routes matched location"
- ❌ React future-flag warnings
- ❌ `cdn.tailwindcss.com` development warnings
- ❌ Provider initialization warnings

### 3. An agent is dispatched

If the error is auto-fixable, the workspace dispatches a follow-up invoke specifically targeting Development. The user's chat shows a new bubble:

```
HiveMind · auto-fix
"Preview threw 'Cannot read properties of undefined (reading map)' —
patching App.tsx."
```

### 4. Development reads the trace and patches the file

The agent receives the error trace, the affected file, and the current artifact tree. It writes a patched version of the broken file back to `.hivemind-previews/<session>/frontend/...` and saves it.

### 5. The diff lands as a bubble

A new `preview_autofix` bubble appears in the chat with green `+N` and red `-N` line counts, plus the affected file path. The user sees the swarm catch its own bug without lifting a finger.

### 6. Sandpack rebuilds

The artifact tree update triggers Sandpack's recompile (debounced 600ms). The preview reloads. If the error is gone, the bubble updates to a success state.

### 7. Budget enforcement

Each user message gets a fresh auto-fix budget of **5 attempts** (`previewAutoFixAttemptsRef`). If the swarm can't fix an error in 5 rounds, it stops and surfaces the trace to the user with a *"manual fix needed"* HiveMind bubble. This prevents infinite loops on truly broken code.

---

## Backend Normalizations

The preview manager (`hivemind-backend/src/services/preview-manager.ts`) applies several normalizations to every generated artifact tree **before** Sandpack sees it. These are hard-learned fixes:

| Problem | Fix |
|---|---|
| Agent ships Vite 6 / 7 / `latest` (rolldown bundler crashes) | Clamp to `^5.4.21` |
| Agent ships rolldown deps | Strip `rolldown`, `rolldown-vite`, `@rolldown/*` |
| `postcss.config.js` uses ESM exports, `package.json` is CommonJS | Force `.cjs` extension, delete `.js` / `.mjs` variants |
| `tailwind.config.js` same problem | Same fix |
| Files with malformed double extensions (`Hero.css.tsx`) | Delete them |
| `.jsx` saved as `.js` with JSX content | Rename to `.jsx` |
| `npm install` failed on a transient network blip | 5-attempt heal loop with re-install |

If any of these fail unrecoverably, the preview returns a friendly amber overlay in the iframe and the chat gets a `system_warn` HiveMind bubble with the captured Vite stderr tail.

---

## Hosted Preview (Coming Soon)

There's a **Host** button in the Code & Preview toolbar that opens a hosted version of the preview at `https://preview.hivemind.<domain>/preview/<session>`. The plumbing is in place, but the button is disabled with a "Soon" badge in the current build — preview hosting is on the post-hackathon roadmap.

---

## Common Issues

### Preview stuck on "Building your preview…"

The bundleable signal hasn't fired. Either:

- Development hasn't written `frontend/package.json` and an entry file yet — wait for it
- The artifact tree got corrupted — refresh the page to re-evaluate

### Preview shows a white blank iframe

Sandpack is bundling but the React app threw before mount. Open DevTools console — usually you'll see the error. The auto-fix loop should trigger within 1-2 seconds; if it doesn't, the error pattern isn't in `looksLikeFixableRuntimeError`.

### "Couldn't connect to bundler / TIME_OUT"

Sandpack's bundler service is slow on big artifact trees. The frontend uses `bundlerTimeOut: 90_000` (90s) and `recompileMode: "delayed"` to mitigate, but very large artifact sets can still time out. Refresh; usually works on the second try.

### Auto-fix bubble appears but the error never clears

The agent's fix didn't address the root cause. Each user message has a 5-attempt budget; once exhausted, the swarm surfaces the trace and waits for human input.

---

## Next

- **[Choosing Models →](./choosing-models)** — pick the right model for Development
- **[Missions →](../missions)** — full lifecycle
- **[First Mission →](./first-mission)** — end-to-end walkthrough
