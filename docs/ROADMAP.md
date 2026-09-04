# Roadmap

What is not here yet, and why it is worth adding. Anything on this list is
open — if you want one of them, an issue or a pull request is welcome.

## Next

- **Dynamic Open Graph images per post.** Rendered at build time with satori
  and rasterized with sharp. Every page currently shares the static card in
  `public/og-default.png`. The cost worth knowing before starting: Astro's
  Fonts API emits only `.woff2`, which satori cannot parse, so this needs a
  vendored TTF of the display face.
- **Tag pages.** `tags` already exist in the post schema and are emitted as
  RSS categories, but they render as static metadata rather than links. Note
  that tags are authored per locale, so a tag page has no cross-locale twin
  and the language picker needs a fallback path.
- **Search.** Pagefind over the built output. Two things to get right: it
  derives result URLs from file paths (`/blog/`) while this site is
  `trailingSlash: "never"`, and it should live on its own route so blog pages
  keep shipping zero JavaScript.

## Later

- **A third locale**, to prove the structure under more than a mirror pair.
- **Playwright smoke tests** over the production build, covering what static
  analysis provably cannot — see "Bugs found by driving the site in a real
  browser" in [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Move reading-time into the content loader** so the blog index stops
  calling `render()` once per row.
- **A table of contents**, from the `headings` that `render()` already
  returns. Sätteri emits the anchors, so this needs no plugin.
