import { satteri } from "@astrojs/markdown-satteri"
import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField, fontProviders } from "astro/config"
import { visualizer } from "rollup-plugin-visualizer"

import { LOCALE_TAGS } from "./src/content/schemas"
import { externalLinksPlugin } from "./src/mdast/external-links"
import { modifiedTimePlugin } from "./src/mdast/modified-time"
import { readingTimePlugin } from "./src/mdast/reading-time"

/** Opt-in bundle treemap: `pnpm analyze`. Never part of a normal build. */
const analyze = process.env.ANALYZE === "true"

export default defineConfig({
  /** Absolute URLs for canonicals, Open Graph, the sitemap and RSS. */
  site: "https://example.com",
  output: "static",
  trailingSlash: "never",

  /**
   * The default locale is unprefixed (`/blog`), others are prefixed
   * (`/id/blog`). Pages use a single `[...lang]` rest parameter and emit
   * `lang: undefined` for English, so each route is written exactly once.
   */
  i18n: {
    locales: ["en", "id"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: { defaultLocale: "en", locales: LOCALE_TAGS },
    }),
  ],

  /**
   * Self-hosted through Astro's Fonts API: it downloads the files, emits
   * `font-display: swap`, and generates metric-matched fallbacks, which is
   * what keeps the layout from shifting as the webfont arrives.
   */
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Geist",
      cssVariable: "--font-geist",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
    },
  ],

  /**
   * Astro 7 renders Markdown with Sätteri, its native Rust pipeline, which
   * does NOT run remark or rehype plugins. These are mdast plugins written
   * against Sätteri's own AST; reaching for a remark plugin here would mean
   * installing @astrojs/markdown-remark and giving up the faster pipeline.
   */
  markdown: {
    /*
     * Both themes are emitted on every token as --shiki-light / --shiki-dark
     * and `defaultColor: false` stops Shiki picking a winner, so the choice
     * happens in CSS. With a single theme Shiki bakes it in as an inline
     * style, and light mode renders a dark code block.
     */
    shikiConfig: {
      /*
       * The high-contrast variants, not plain github-light/dark. The Lighthouse
       * budget asserts accessibility at exactly 1.00, and github-light's comment
       * token is #6A737D on white — 4.4:1, which fails the 4.5:1 threshold and
       * takes the whole page down with it.
       */
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark-high-contrast",
      },
      defaultColor: false,
    },
    processor: satteri({
      mdastPlugins: [
        readingTimePlugin,
        modifiedTimePlugin,
        externalLinksPlugin,
      ],
    }),
  },

  env: {
    schema: {
      PUBLIC_ANALYTICS_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },

  vite: {
    /**
     * Force a single React instance. Vite pre-bundles dependencies in dev,
     * and React reached the island through a different module instance than
     * react-dom's renderer used — the hooks dispatcher was then null and
     * hydration died with "Cannot read properties of null (reading
     * 'useState')", wiping the server-rendered pricing table. Production
     * bundling never split them, so this only ever broke `astro dev`.
     */
    resolve: { dedupe: ["react", "react-dom"] },
    optimizeDeps: { include: ["react", "react-dom", "react-dom/client"] },
    plugins: [
      tailwindcss(),
      ...(analyze
        ? [
            visualizer({
              filename: "stats.html",
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
  },
})
