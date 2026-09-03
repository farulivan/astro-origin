# Delivery Plan

How this boilerplate was scoped, ordered and verified. The technical design is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Goal

A starting point for a real marketing site: bilingual, content-driven, fast by construction, and structured so the interesting decisions are already made and written down. It borrows its discipline — pure kernels, one-way dependencies, mechanically enforced rules, documented trade-offs — from the sibling `hotel-dashboard` project, without borrowing its stack, which was built for a different shape of problem.

The bar is not visual complexity. It is that someone can clone this, replace the copy in three files, and ship.

## Scope

### Core

| #   | Area               | Acceptance                                                                                                                                          |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Landing page       | Hero, features, pricing, testimonials, FAQ, closing CTA — all content-driven, none hardcoded in components                                          |
| 2   | Blog               | Listing, pagination, article pages, MDX, reading time, tags, draft filtering                                                                        |
| 3   | i18n               | English and Indonesian; every route written once; language picker keeps the reader on the page; untranslated articles fall back with a visible note |
| 4   | Theme              | Light / dark / system, persisted, with no flash of the wrong theme on load                                                                          |
| 5   | SEO                | Canonical, Open Graph, Twitter, JSON-LD, hreflang + `x-default`, per-locale sitemap alternates, per-locale RSS                                      |
| 6   | Zero JS by default | Only genuinely interactive UI ships JavaScript, and only when scrolled into view                                                                    |
| 7   | Type safety        | Invalid content fails the build; a missing translation fails typecheck                                                                              |
| 8   | Responsive         | Usable from 390 px up                                                                                                                               |

### Beyond core

- Sätteri mdast plugins: reading time, git-derived modified time, external-link marking
- An architecture checker that enforces the layering rules as text
- A Lighthouse budget in CI asserting accessibility = 1.00
- Container-API tests for `.astro` components; Testing Library for the island
- Bundle treemap behind `pnpm analyze`
- Typed environment variables via `astro:env`

### Out of scope, deliberately

- SSR, API routes, forms, captcha — all `output: "static"`; each is one adapter away
- A CMS — the loader boundary exists precisely so this is a later, cheap decision
- Dynamic per-post OG image generation
- A third locale (the structure supports it; the content does not exist)

## Build order

Each phase left the project working.

- [x] **Phase 0 — Scaffold.** `create-astro`, Tailwind v4, Prettier (+ astro, + tailwindcss last), ESLint flat config, cspell, `@/*` alias.
- [x] **Phase 1 — Kernels.** Schemas, dictionary, locale helpers, config, formatters, content config, seed content for both locales, unit tests.
- [x] **Phase 2 — Shell.** Base layout, SEO component, header, footer, theme toggle, language picker, tokens, fonts, i18n routing.
- [x] **Phase 3 — UI primitives.** Button, Container, Card, Badge, Prose, Icon — plus Container-API tests.
- [x] **Phase 4 — Landing page.** Six sections, all fed by props from collections queried in the page.
- [x] **Phase 5 — Island.** `PricingToggle`, `client:visible`, strings and formatted prices passed as props.
- [x] **Phase 6 — Blog.** Four routes, post layout, `render()`, pagination, drafts, untranslated fallback, three Sätteri plugins.
- [x] **Phase 7 — Discovery.** Sitemap with hreflang, per-locale RSS, robots.txt, 404.
- [x] **Phase 8 — Hardening.** CI, architecture checker, Lighthouse budget, docs.

## Prioritization rationale

1. **Kernels first.** The rules that both the build and the UI depend on are written and tested before any UI exists, so nothing downstream can quietly disagree with them.
2. **The shell before the sections.** i18n routing and the theme are cross-cutting; retrofitting either into finished pages is far more expensive than starting with them.
3. **The island last.** Building the page with zero JavaScript first makes it obvious how little of it actually needs a framework.

## Decisions worth knowing

Each of these was a fork in the road, and the reasoning is in [ARCHITECTURE.md](./ARCHITECTURE.md):

| Decision                                 | Short version                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Node + pnpm, not Bun                     | Astro's docs caution against Bun, and `bun test` cannot compile `.astro` at all |
| TypeScript 6, not 7                      | `@astrojs/check` and typescript-eslint both reject TS 7 today                   |
| Sätteri mdast plugins, not remark        | Astro 7 does not run remark plugins; most tutorials online are now wrong        |
| `astro/zod`, not a `zod` install         | Version skew between two copies of Zod breaks `defineCollection`                |
| `[...lang]` with `undefined` for English | One file per route instead of a duplicated page tree, and no root redirect      |
| `translationKey` as the URL slug         | Guarantees `/blog/x` and `/id/blog/x` are the same article                      |
| Frontmatter `updatedDate` over git       | Vercel shallow-clones at depth 2 and cannot be configured                       |
| Prop named `tag`, not `as`               | `as` is a TS keyword and silently breaks Astro's `Props` binding                |

## Verification

- `pnpm verify` — format, lint, spell, architecture rules, typecheck, tests, build
- `pnpm dlx @lhci/cli autorun` — Lighthouse budget over both locales, landing and blog
- Manual pass at 390 px in both locales and both themes

Current state: **60 tests green, 0 type errors, 0 lint errors, 0 spelling issues, 5/5 architecture rules, Lighthouse 100/100/100/100 on all four audited pages.**

## What I would add next

- Dynamic OG images per post (satori + resvg at build time)
- A third locale, to prove the structure under more than a mirror pair
- Playwright smoke tests over the production build
- Move reading-time computation into the content loader so the list view stops calling `render()` per row
