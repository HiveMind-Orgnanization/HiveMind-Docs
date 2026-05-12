# HiveMind — Docs

> Docusaurus documentation site for HiveMind, an autonomous AI workforce on Solana.

This repo contains the user-facing and developer-facing docs: introduction, architecture, agent role contracts, mission lifecycle, treasury mechanics, API reference, and step-by-step guides for every shipped feature.

**Frontend:** [HiveMind-Frontend](https://github.com/HiveMind-Orgnanization/HiveMind-Frontend) · **Backend:** [HiveMind-Backend](https://github.com/HiveMind-Orgnanization/HiveMind-Backend) · **Contracts:** [hivemind-contracts](https://github.com/HiveMind-Orgnanization/hivemind-contracts)

---

## What's in this repo

```
hivemind-docs/
├── docs/
│   ├── intro.md              # Landing — what HiveMind is, who it's for
│   ├── quick-start.md        # 5-minute setup (hosted or local)
│   ├── architecture.md       # Four-layer system design
│   ├── missions.md           # Mission type + lifecycle + API
│   ├── treasury.md           # Four-bucket math + deposit flow
│   ├── memory.md             # Shared memory primitives
│   ├── reputation.md         # On-chain reputation PDAs
│   ├── contracts.md          # Anchor program reference
│   ├── api-reference.md      # REST + WebSocket endpoints
│   ├── sdk.md                # Client SDK usage
│   ├── agents/
│   │   └── overview.md       # Nine specialist agents
│   └── guides/
│       ├── first-mission.md
│       ├── choosing-models.md
│       ├── live-preview.md           # Sandpack + auto-fix loop
│       ├── treasury-deposit.md       # On-chain deposit walkthrough
│       ├── follow-up-paywall.md      # 5 free + 0.05 SOL/msg
│       ├── on-chain-settlement.md
│       ├── efficient-usage.md
│       ├── customization.md
│       └── custom-agent.md
├── src/                      # Custom React components (rarely touched)
├── static/                   # Images, favicon, og-image
├── sidebars.ts               # Sidebar structure
├── docusaurus.config.ts      # Site config (URL, navbar, footer)
└── package.json
```

---

## Tech stack

- **Docusaurus 3** — static-site generator
- **React** + **TypeScript** — for custom components in `src/`
- **MDX** — Markdown with JSX (used sparingly)

---

## Local setup

### Prerequisites

- **Node.js 20+**
- **npm** or **pnpm**

### Install and run

```bash
git clone https://github.com/HiveMind-Orgnanization/HiveMind-Docs.git
cd HiveMind-Docs
npm install
npm start
```

The dev server hot-reloads at `http://localhost:3000`.

### Build the static site

```bash
npm run build       # → build/
npm run serve       # serve build/ locally
```

The build runs broken-link validation — if you reference a doc page that doesn't exist, the build fails. This is intentional. Fix the link, don't lower the threshold.

---

## Deployment

The site is hosted from the same domain as the frontend (Vercel rewrites `/docs/` to this build). To deploy a standalone version:

```bash
npm run build
# Upload the build/ directory to any static host (Netlify, S3, GitHub Pages)
```

For Vercel:

```bash
vercel link
vercel deploy --prod
```

---

## Editing docs

Every doc is a Markdown file under `docs/`. Frontmatter defines the sidebar position and title:

```markdown
---
id: my-doc
title: My Doc
sidebar_position: 5
---

# My Doc

Content here.
```

To add a new doc to the sidebar, edit `sidebars.ts`:

```typescript
{
  type: "category",
  label: "Guides",
  items: [
    "guides/first-mission",
    "guides/my-new-guide",   // ← add it here
    ...
  ],
}
```

---

## Docs style guide

- **Accuracy over aspiration.** If a feature isn't shipped, don't document it as if it is. Use the *(Coming soon)* convention or omit entirely.
- **Concrete examples.** Show real env vars, real URLs, real program IDs.
- **No marketing prose.** "Leverage", "revolutionize", "ecosystem" don't appear in docs.
- **Cross-link liberally.** Every page should link to 2–3 related pages.
- **Code blocks specify the language** for syntax highlighting (` ```bash`, ` ```typescript`, etc.).
- **Tables for comparisons.** Lists for sequences. Headings for navigation, not emphasis.

---

## Contributing

The docs were written during the Colosseum hackathon and aim to match exactly what's shipped. If you spot a gap between the docs and reality, that's a bug — please open an issue or send a PR.

### Good first issues

- Add example responses to every endpoint in `api-reference.md`
- Add screenshots to `guides/treasury-deposit.md` (currently text-only)
- Translate `intro.md` and `quick-start.md` to additional languages
- Add a "What's New" page that tracks shipped features by date

### What we won't merge

- Aspirational features described as live
- Marketing language ("revolutionizing", "disruptive", "next-generation")
- Pages with no cross-links
- Removed-feature pages without a deprecation notice

---

## Related repos

- **[HiveMind-Frontend](https://github.com/HiveMind-Orgnanization/HiveMind-Frontend)** — Vite + React UI
- **[HiveMind-Backend](https://github.com/HiveMind-Orgnanization/HiveMind-Backend)** — Fastify API
- **[hivemind-contracts](https://github.com/HiveMind-Orgnanization/hivemind-contracts)** — Anchor Solana program

---

## License

MIT — see `LICENSE`.

Built for the [Colosseum Hackathon](https://www.colosseum.org/), May 2026.
