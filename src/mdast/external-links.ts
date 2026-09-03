import { defineMdastPlugin } from "satteri"

import { isLocale } from "../i18n/utils"
import { ui } from "../i18n/ui"
import { DEFAULT_LOCALE } from "../content/schemas"

import { frontmatterOf } from "./astro-data"

// Relative imports, not the "@/" alias: astro.config loads this module while
// building the very config that defines the alias, so it cannot rely on it.

/**
 * Marks links that leave the site: opens them in a new tab, blocks reverse
 * tabnabbing, tags them for the arrow icon the stylesheet draws, and appends
 * a screen-reader-only note so the new tab is announced rather than sprung.
 *
 * The announcement is translated by reading the post's own `lang` — the same
 * dictionary the components use at render time. Build-time code sharing the
 * i18n kernel is the direct counterpart of `hotel-dashboard`'s mock server
 * importing `src/domain`: one definition, both sides of the boundary.
 */
export const externalLinksPlugin = defineMdastPlugin({
  name: "external-links",
  link(node, ctx) {
    const url = node.url
    if (!/^https?:\/\//i.test(url)) return

    ctx.setProperty(node, "data", {
      ...node.data,
      hProperties: {
        target: "_blank",
        rel: "noopener noreferrer",
        "data-external": "true",
      },
    })

    const frontmatterLang = frontmatterOf(ctx.data)?.lang
    const lang = isLocale(frontmatterLang) ? frontmatterLang : DEFAULT_LOCALE

    ctx.appendChild(node, {
      raw: `<span class="sr-only"> ${ui[lang]["a11y.externalLink"]}</span>`,
      mdxExpressions: false,
    })
  },
})
