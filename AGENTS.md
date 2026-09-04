# Working in this repository

Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) before making structural changes. The short version and the traps are below.

## Commands

```bash
pnpm dev         # dev server
pnpm setup       # rewrite the placeholder identity as your own
pnpm verify      # everything CI runs
pnpm check       # astro check on its own
pnpm check:arch  # just the layering rules
pnpm build       # runs `astro check` first, then builds
pnpm build:fast  # skips the type check, for quick local iteration
```

`build` type-checks first on purpose: `astro build` transpiles without checking types, and Vercel runs `pnpm build`, so without it a type error could reach production.

When starting the dev server for a long-running task, use `astro dev --background`, then `astro dev stop` / `status` / `logs`.

## Rules enforced by `pnpm check:arch`

1. `.tsx` only inside `src/components/islands/` — everything else is `.astro` and ships no JS.
2. `getCollection` only in `src/pages/**` and `src/content/queries.ts` — sections take props.
3. The Markdown pipeline stays on Sätteri; do not install `@astrojs/markdown-remark`.
4. `src/i18n/*` and `src/content/schemas.ts` import nothing from Astro or components.
5. Components translate through `useTranslations`, never by reading `ui[...]` directly.

## Traps

- **Astro 7 uses Sätteri, not remark.** Remark/rehype plugins do not run. Write Sätteri mdast plugins (see `src/mdast/`).
- **Never name a prop `as`.** It is a TS keyword and silently breaks Astro's `Props` binding, producing implicit-`any` errors in _unrelated_ files. Use `tag`. Astro's documented `Polymorphic<{ as: Tag }>` helper hits the same problem in 7.2.10, one level removed — it type-checks in isolation but breaks Props binding in the components that consume it. `Container.astro` records the full finding.
- **Keep angle-bracket tag names out of `.astro` frontmatter comments.** Writing `<section>` in a JSDoc block there can panic the `.astro` to TSX transform (`slice bounds out of range`), after which every importing file reports "is not a module". Write "a section element" instead.
- **Import Zod from `astro/zod`,** never a separate `zod` install — two copies break `defineCollection`.
- **TypeScript stays on 6.0.x.** `@astrojs/check` and typescript-eslint both reject TS 7 today.
- **The theme script in `BaseLayout.astro` must stay inline and blocking.** Deferring it causes a flash of the wrong theme.
- **Adding a string?** Add it to `en` in `src/i18n/ui.ts` first; typecheck will then demand the Indonesian one.

- **Tailwind v4 registers `prose` as a utility.** Typography's
  `.prose :where(pre)` therefore lands in the utilities layer and outranks
  anything in `@layer components`, no matter how specific — `:where()`
  contributes no specificity, so a bare `.astro-code` ties and loses on
  source order. The Shiki rules in `global.css` sit outside every layer for
  exactly this reason. Check the cascade layer before adding specificity.
- **The Lighthouse budget asserts accessibility at exactly 1.00**, and it
  audits every page the build produces, in both locales. One token colour in
  one code block is enough to fail it: `github-light`'s comment is #6A737D on
  white, which is 4.4:1. Use the `-high-contrast` Shiki themes.
- **Preload every font that sets real text.** Geist Mono sets dates, tags and
  waypoints on every page; leaving it out of the preload cost 0.137 CLS on
  post pages.

## Behavior traps (all previously shipped as bugs)

- **A scoped `<style>` cannot reach an element another component renders.** Styling a `<Card tag="li">` from its parent silently does nothing; pass the class instead.
- **Astro components forward nothing you did not declare.** A component typed with three props drops every other attribute without warning. Extend `HTMLAttributes<...>`.
- **Do not add `scroll-behavior: smooth`.** It cancels on any interruption and leaves anchor links setting the hash without moving the page — which also stops `client:visible` islands from ever hydrating.
- **Keep `resolve.dedupe` for react/react-dom** in `astro.config.ts`, or dev-mode hydration dies with a null hooks dispatcher.
- **Route to `/#` for anything without a real destination.** Never invent a plausible URL.

## Where things live

| Want to change                  | Edit                     |
| ------------------------------- | ------------------------ |
| Brand, URL, nav, posts per page | `src/config/site.ts`     |
| Any user-facing string          | `src/i18n/ui.ts`         |
| Page copy, pricing, posts       | `src/content/`           |
| Colors and typography           | `src/styles/global.css`  |
| What counts as valid content    | `src/content/schemas.ts` |
