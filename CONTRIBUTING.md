# Contributing

Thanks for taking a look. Issues and pull requests are both welcome.

## Getting set up

```bash
pnpm install
pnpm dev
```

Node 22.12+ and pnpm 11. There is nothing else to configure.

## The gate

```bash
pnpm verify
```

That runs everything CI runs, in the same order: formatting, lint, spelling,
the architecture rules, types, tests and a build. If it passes locally it
will pass in CI, apart from the Lighthouse budget — run that with
`pnpm dlx @lhci/cli@0.15.1 autorun` after a build if you have changed
anything visual.

## Things that will fail review

These are checked mechanically by `pnpm check:arch`, so you will find out
before a reviewer does:

1. `.tsx` lives only in `src/components/islands/`. Everything else is
   `.astro` and ships no JavaScript.
2. `getCollection` is called only from `src/pages/**` and
   `src/content/queries.ts`. Sections take props.
3. The Markdown pipeline stays on Sätteri. Do not install
   `@astrojs/markdown-remark`.
4. `src/i18n/*` and `src/content/schemas.ts` import nothing from Astro or
   from components — that is what keeps them testable without a build.
5. Components translate through `useTranslations`, never by reading `ui[...]`
   directly.

Two more that are not scripted:

- **New user-facing strings go into `en` in `src/i18n/ui.ts` first.** The
  typecheck will then tell you which other locales owe a translation.
- **Accessibility is asserted at exactly 1.00**, not "good". A change that
  drops it fails the build.

[AGENTS.md](./AGENTS.md) has the traps worth knowing before you start —
every entry in it was a real bug first.

## Commits

Conventional commits (`feat:`, `fix:`, `docs:`, `ci:`…). Explain why in the
body; the diff already says what.
