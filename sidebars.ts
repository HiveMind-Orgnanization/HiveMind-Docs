import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    "quick-start",
    {
      type: "category",
      label: "Core Concepts",
      collapsed: false,
      items: [
        "architecture",
        "agents/overview",
        "missions",
        "memory",
        "treasury",
        "reputation",
      ],
    },
    {
      type: "category",
      label: "Integrations",
      items: [
        "contracts",
        "api-reference",
        "sdk",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/first-mission",
        "guides/choosing-models",
        "guides/live-preview",
        "guides/treasury-deposit",
        "guides/follow-up-paywall",
        "guides/on-chain-settlement",
        "guides/efficient-usage",
        "guides/customization",
        "guides/custom-agent",
      ],
    },
  ],
};

export default sidebars;
