# Astro Landing Page Boilerplate

A production-shaped starting point for a static marketing site: bilingual, content-driven, dark mode, a blog, and a perfect Lighthouse score out of the box.

It is opinionated about one thing — **content is typed, schema-validated data at the bottom of the stack, and components render it rather than author it.** Invalid content fails the build. A missing translation fails typecheck. Everything else follows from that.

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (usually `http://localhost:4321`).

**Requirements:** Node 22.12+ and pnpm 11. No environment variables, no database, no backend.

## What's in it

**Core**

- Landing page — hero, features, pricing, testimonials, FAQ, closing CTA, every word coming from content collections rather than JSX
- Blog — MDX, pagination, tags, reading time, draft filtering, per-locale RSS
- Full i18n — English and Indonesian, every route written once, a language picker that keeps you on the same page, and a visible fallback when an article isn't translated yet
- Light / dark / system theme with no flash on load
- SEO — canonical, Open Graph, Twitter cards, JSON-LD, `hreflang` + `x-default`, sitemap with locale alternates
- Zero JavaScript by default; blog pages ship none at all

**Tooling**

- Prettier, ESLint (with the Astro and a11y plugins), cspell with an Indonesian dictionary
- Vitest — unit tests for the pure logic, Astro's Container API for `.astro` components, Testing Library for the island
- An architecture checker that enforces the layering rules as text
- A Lighthouse budget in CI that asserts accessibility = 1.00
- GitHub Actions running all of it on every push

## Measured

```
page                                   perf  a11y    bp   seo      LCP    CLS    TBT
/                                      1.00  1.00  1.00  1.00   1207ms  0.000     0ms
/id/                                   1.00  1.00  1.00  1.00   1205ms  0.000     0ms
/blog                                  1.00  1.00  1.00  1.00   1205ms  0.000     0ms
/blog/shipping-on-fridays              1.00  1.00  1.00  1.00   1204ms  0.000     0ms
```

Blog pages reference zero JavaScript files. Landing pages reference exactly one island, fetched only if you scroll to the pricing table.

## Scripts

| Command                                    | What it does                                            |
| ------------------------------------------ | ------------------------------------------------------- |
| `pnpm dev`                                 | Dev server                                              |
| `pnpm build` / `pnpm preview`              | Production build, then serve it                         |
| `pnpm test` / `pnpm test:watch`            | Vitest                                                  |
| `pnpm check`                               | `astro check` — types across `.ts`, `.tsx` and `.astro` |
| `pnpm check:arch`                          | The five architectural rules                            |
| `pnpm lint` / `pnpm format` / `pnpm spell` | ESLint / Prettier / cspell                              |
| `pnpm analyze`                             | Build with a bundle treemap at `stats.html`             |
| `pnpm verify`                              | Everything CI runs, in order                            |

## Making it yours

Three files hold almost everything you'd change first:

1. **`src/config/site.ts`** — name, URL, navigation, social links, posts per page, signup URL.
2. **`src/i18n/ui.ts`** — every user-facing string, in both languages.
3. **`src/content/`** — features, pricing tiers, testimonials, FAQ entries, blog posts.

Then `src/styles/global.css` for the color tokens, and `public/og-default.png` for the social card (the shipped one is a placeholder gradient).

**Adding a locale:** add it to `LOCALES` in `src/content/schemas.ts`, add a dictionary object in `src/i18n/ui.ts`, add its content. No route, page or component changes — TypeScript will list every string you still owe.

**Adding a page:** create `src/pages/[...lang]/whatever.astro`, copy the `getStaticPaths` block from `index.astro`, and it exists in every locale.

## Architecture in one screen

```
Pages       src/pages/[...lang]/**   resolve locale, query content, set SEO
Layouts     src/layouts/**           <html lang> + theme, head, fonts
Sections    src/components/sections/ props in, HTML out — never query
UI          src/components/ui/       primitives
Islands     src/components/islands/  the ONLY .tsx
─────────────────────────────────────────────────────────────
Schemas     src/content/schemas.ts   pure Zod   ← invalid content fails build
i18n        src/i18n/ui.ts           pure TS    ← missing string fails typecheck
Config      src/config/site.ts
Lib         src/lib/
─────────────────── content boundary ────────────────────────
Query       src/content/queries.ts   locale + fallback rules
Content     src/content/**           Markdown / MDX / JSON
Build-time  src/mdast/**             Sätteri enrichment
```

Five rules, all checked by `pnpm check:arch`: `.tsx` only in `islands/`; `getCollection` only in pages and the query layer; Markdown stays on Sätteri; the kernels import nothing from Astro; components translate through `t()`.

The full write-up — why Bun was rejected, why Astro 7 breaks every remark tutorial, why the pricing toggle is an island and the theme toggle isn't, and the two real accessibility bugs the Lighthouse budget caught — is in **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**. Scope and build order are in [docs/PLAN.md](./docs/PLAN.md).

## Three things that will surprise you

1. **Astro 7 does not run remark plugins.** It renders Markdown with Sätteri, a Rust processor with its own AST. Nearly every "add X to your Astro Markdown" article online is a remark plugin and will silently do nothing. The plugins in `src/mdast/` are Sätteri plugins.
2. **A prop named `as` breaks Astro's `Props` binding.** It is a TypeScript keyword, and defining it as a prop stops Astro typing `Astro.props` — which surfaces as confusing implicit-`any` errors in _other_ files. Polymorphic components here use `tag`.
3. **Git-derived "last modified" dates are wrong on Vercel.** Vercel clones at depth 2 and won't let you change it, so `git log` resolves to the wrong commit. Frontmatter `updatedDate` is the source of truth; the git timestamp is a fallback.

## Deployment

Static output, so any host works. `vercel.json` is included: framework preset Astro, `pnpm install --frozen-lockfile`, `pnpm build`, output `dist/`. No SPA rewrite needed — Astro emits a real file per route, in every locale.

## A fourth surprise, for completeness

Writing an angle-bracket tag name inside a `.astro` frontmatter comment — `<section>` in a JSDoc block — can panic Astro 7.2.10's `.astro` to TSX transform with `slice bounds out of range`. The file compiles to nothing and every importer then fails with "is not a module", pointing at the innocent files rather than the comment. Describe elements in prose instead.
