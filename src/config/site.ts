/**
 * App-level configuration — the first place to edit when reusing this
 * template for a real product, and the only one `pnpm setup` rewrites
 * automatically. Content rules live in
 * `src/content/schemas.ts` and copy lives in `src/i18n/ui.ts`; neither
 * belongs here.
 */
import type { TranslationKey } from "@/i18n/ui"

export const siteConfig = {
  /** Brand name. Appears in <title>, the wordmark and structured data. */
  name: "Origin",
  /**
   * Canonical origin, no trailing slash. Also set as `site` in
   * astro.config.ts, which is what makes canonical URLs, the sitemap, RSS
   * and robots.txt absolute. `pnpm setup` rewrites both.
   */
  url: "https://astro-origin.farulivan.com",
  /** Fallback Open Graph image, served from public/. */
  ogImage: "/og-default.png",
  /**
   * Where every pricing CTA points. "/#" is a deliberate placeholder: a
   * real-looking URL is the kind of thing that survives to production
   * unnoticed, while a link that visibly goes nowhere does not.
   */
  signupUrl: "/#",
  /** @-handle used for twitter:site; omit the leading @. */
  twitterHandle: "astro_origin",
  /**
   * Blog posts per page. Deliberately low so the seed content exercises
   * pagination; a real site wants something like 10.
   */
  postsPerPage: 2,
  /** localStorage key for the chosen theme. */
  themeStorageKey: "origin.theme",
  /**
   * Primary navigation. `key` is a translation key rather than literal text,
   * so adding a locale never means touching this file.
   */
  nav: [
    { key: "nav.features", href: "/#features" },
    { key: "nav.pricing", href: "/#pricing" },
    { key: "nav.faq", href: "/#faq" },
    { key: "nav.blog", href: "/blog" },
  ],
  /** Placeholders. Swap in real URLs and they become external links. */
  social: {
    github: "/#",
    x: "/#",
  },
} as const satisfies {
  name: string
  url: string
  ogImage: string
  signupUrl: string
  twitterHandle: string
  postsPerPage: number
  themeStorageKey: string
  nav: readonly { key: TranslationKey; href: string }[]
  social: Readonly<Record<string, string>>
}
