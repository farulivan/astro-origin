import getReadingTime from "reading-time"
import { defineMdastPlugin } from "satteri"

import { frontmatterOf } from "./astro-data"

/**
 * Adds `minutesRead` to a post's frontmatter at build time.
 *
 * A Sätteri mdast plugin, not a remark one: Astro 7 replaced the
 * remark/rehype pipeline with Sätteri, which has its own AST and does not run
 * remark plugins at all. Most "add reading time to Astro" guides online
 * predate this and will silently do nothing.
 *
 * Runs in `after` so the count reflects the finished tree, including anything
 * earlier plugins injected. Only the raw minute count is stored — the wording
 * is a translated string chosen at render time, so the number stays
 * language-agnostic here.
 */
export const readingTimePlugin = defineMdastPlugin({
  name: "reading-time",
  after(root, ctx) {
    const frontmatter = frontmatterOf(ctx.data)
    if (!frontmatter) return

    const text = ctx.textContent(root)
    frontmatter.minutesRead = Math.max(
      1,
      Math.round(getReadingTime(text).minutes)
    )
  },
})
