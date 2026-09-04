import type { APIRoute } from "astro"

/**
 * Generated rather than kept in public/, because the sitemap line has to
 * carry the site's real origin. As a static file it was a third place the
 * origin was written down, and the one nobody remembers to change — a wrong
 * value there is invisible until a crawler reads it.
 *
 * Add crawl rules here; the sitemap line takes care of itself.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${new URL("sitemap-index.xml", site).href}`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  )
