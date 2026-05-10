import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "HiveMind Protocol",
  tagline: "Hire an AI Workforce. Not Just an Assistant.",
  favicon: "img/favicon.ico",

  future: { v4: true },

  url: "http://localhost:5173",
  baseUrl: "/docs/",

  onBrokenLinks: "warn",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    image: "img/og-image.png",
    navbar: {
      title: "HiveMind",
      logo: {
        alt: "HiveMind Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "http://localhost:5173",
          label: "← Back to App",
          position: "right",
        },
        {
          href: "https://github.com/hivemind-protocol",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Get Started",
          items: [
            { label: "Quick Start", to: "quick-start" },
            { label: "Architecture", to: "architecture" },
            { label: "Agents", to: "agents/overview" },
          ],
        },
        {
          title: "Reference",
          items: [
            { label: "API Reference", to: "api-reference" },
            { label: "Smart Contracts", to: "contracts" },
            { label: "SDK", to: "sdk" },
          ],
        },
        {
          title: "Product",
          items: [
            { label: "Dashboard", href: "http://localhost:5173/dashboard" },
            { label: "Marketplace", href: "http://localhost:5173/marketplace" },
            { label: "Treasury", href: "http://localhost:5173/treasury" },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} HiveMind Protocol — Built on Solana`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ["bash", "typescript", "json", "rust", "toml"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
