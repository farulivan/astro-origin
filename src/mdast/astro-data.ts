/**
 * Shared typing for the slot Astro exposes to Markdown plugins.
 *
 * Sätteri's `ctx.data` is an open bag; Astro puts the document's frontmatter
 * at `data.astro.frontmatter`, and anything a plugin writes there is readable
 * from a page as `remarkPluginFrontmatter` after `render()`. The name is a
 * leftover from the remark era — Sätteri kept it so existing pages still work.
 */
export interface AstroMarkdownData {
  astro?: { frontmatter: Record<string, unknown> }
}

/** Narrows the open data bag to Astro's frontmatter slot, or undefined. */
export function frontmatterOf(
  data: unknown
): Record<string, unknown> | undefined {
  const astro = (data as AstroMarkdownData | undefined)?.astro
  return astro?.frontmatter
}
