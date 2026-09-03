/**
 * App-level configuration — the one place to edit when reusing this
 * boilerplate for a real product. Content rules live in
 * `src/content/schemas.ts` and copy lives in `src/i18n/ui.ts`; neither
 * belongs here.
 */
import type { TranslationKey } from "@/i18n/ui"

export const siteConfig = {
  /** Brand name. Appears in <title>, the wordmark and structured data. */
  name: "Beacon",
  /**
   * Canonical origin, no trailing slash. Also set as `site` in
   * astro.config.mjs, which is what makes canonical URLs, the sitemap and
   * RSS absolute.
   */
  url: "https://example.com",
  /** Fallback Open Graph image, served from public/. */
  ogImage: "/og-default.png",
  /**
   * Where every pricing CTA points. "/#" is a deliberate placeholder: a
   * real-looking URL is the kind of thing that survives to production
   * unnoticed, while a link that visibly goes nowhere does not.
   */
  signupUrl: "/#",
  /** @-handle used for twitter:site; omit the leading @. */
  twitterHandle: "beacon",
  /**
   * Blog posts per page. Deliberately low so the seed content exercises
   * pagination; a real site wants something like 10.
   */
  postsPerPage: 2,
  /** localStorage key for the chosen theme. */
  themeStorageKey: "beacon.theme",
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
