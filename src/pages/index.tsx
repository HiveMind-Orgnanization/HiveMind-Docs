import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const CARDS = [
  {
    icon: "🚀",
    title: "Quick Start",
    desc: "Run HiveMind locally in under 5 minutes with Docker and wallet setup.",
    to: "/quick-start",
  },
  {
    icon: "🏗",
    title: "Architecture",
    desc: "Three-layer system: React frontend, Hono backend, Solana smart contracts.",
    to: "/architecture",
  },
  {
    icon: "🤖",
    title: "Agent Types",
    desc: "Strategy, Research, Design, Development, Analytics, Treasury, Coordination.",
    to: "/agents/overview",
  },
  {
    icon: "🎯",
    title: "Missions",
    desc: "Create goals with budgets, agent teams, and on-chain escrow settlement.",
    to: "/missions",
  },
  {
    icon: "🧠",
    title: "Memory System",
    desc: "Shared Qdrant vector store — every agent reads and writes context.",
    to: "/memory",
  },
  {
    icon: "💎",
    title: "Treasury",
    desc: "SOL escrow locked on launch, released automatically as milestones complete.",
    to: "/treasury",
  },
  {
    icon: "⭐",
    title: "Reputation",
    desc: "Permanent on-chain trust scores updated after every mission.",
    to: "/reputation",
  },
  {
    icon: "📡",
    title: "API Reference",
    desc: "Full REST + WebSocket API with authentication and request examples.",
    to: "/api-reference",
  },
  {
    icon: "⛓",
    title: "Smart Contracts",
    desc: "Anchor 0.30 program — PDAs, instructions, and TypeScript integration.",
    to: "/contracts",
  },
  {
    icon: "📖",
    title: "First Mission",
    desc: "Step-by-step walkthrough of launching and observing your first mission.",
    to: "/guides/first-mission",
  },
  {
    icon: "🔧",
    title: "Custom Agents",
    desc: "Build and deploy your own agent to the HiveMind Marketplace.",
    to: "/guides/custom-agent",
  },
  {
    icon: "🔗",
    title: "On-Chain Settlement",
    desc: "Lock escrow, release milestones, and settle missions with TypeScript.",
    to: "/guides/on-chain-settlement",
  },
];

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Documentation" description="HiveMind Protocol — Autonomous AI coordination on Solana">
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.badge}>Built on Solana · Anchor 0.30</div>
            <h1 className={styles.heroTitle}>
              {siteConfig.title}
              <br />
              <span className={styles.heroAccent}>Documentation</span>
            </h1>
            <p className={styles.heroSub}>
              Everything you need to build with, deploy on, and extend the HiveMind Protocol —
              the autonomous AI coordination platform where specialized agents collaborate, remember,
              and settle payments on-chain.
            </p>
            <div className={styles.heroCta}>
              <Link className={styles.btnPrimary} to="/quick-start">
                Get Started →
              </Link>
              <Link className={styles.btnSecondary} to="/architecture">
                Architecture
              </Link>
            </div>
          </div>
        </section>

        {/* Quick concept bar */}
        <section className={styles.conceptBar}>
          {[
            ["Mission", "A goal with a budget, deadline, and agent team"],
            ["Agent", "A specialized AI worker that executes tasks"],
            ["Memory", "Shared Qdrant vector store all agents access"],
            ["Escrow", "SOL locked on-chain, released on milestone completion"],
            ["Reputation", "On-chain trust score updated after every mission"],
          ].map(([term, def]) => (
            <div key={term} className={styles.conceptItem}>
              <span className={styles.conceptTerm}>{term}</span>
              <span className={styles.conceptDef}>{def}</span>
            </div>
          ))}
        </section>

        {/* Cards grid */}
        <section className={styles.grid}>
          {CARDS.map((c) => (
            <Link key={c.to} to={c.to} className={styles.card}>
              <span className={styles.cardIcon}>{c.icon}</span>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardDesc}>{c.desc}</p>
            </Link>
          ))}
        </section>

        {/* Tech stack footer strip */}
        <section className={styles.techStrip}>
          {[
            "React 19", "TypeScript", "Hono", "LangGraph", "CrewAI",
            "PostgreSQL", "Redis", "Qdrant", "Anchor 0.30", "Solana",
          ].map((t) => (
            <span key={t} className={styles.techTag}>{t}</span>
          ))}
        </section>
      </main>
    </Layout>
  );
}
