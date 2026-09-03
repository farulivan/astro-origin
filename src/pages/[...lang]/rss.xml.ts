import rss from "@astrojs/rss"
import type { APIContext } from "astro"

import { siteConfig } from "@/config/site"
import { getPosts, postSlug } from "@/content/queries"
import { LOCALES, LOCALE_TAGS, type Locale } from "@/content/schemas"
import { langParam, localizePath, useTranslations } from "@/i18n/utils"

/**
 * One feed per locale: /rss.xml and /id/rss.xml. Endpoints take
 * `getStaticPaths` exactly like pages, so the same `[...lang]` trick applies
 * and the default locale's feed stays at the root.
 */
export function getStaticPaths() {
  return LOCALES.map((lang) => ({
    params: { lang: langParam(lang) },
    props: { lang },
  }))
}

export async function GET(context: APIContext) {
  const { lang } = context.props as { lang: Locale }
  const t = useTranslations(lang)
  const posts = await getPosts(lang)

  return rss({
    title: `${siteConfig.name} — ${t("blog.title")}`,
    description: t("blog.subtitle"),
    site: context.site ?? siteConfig.url,
    // Untranslated articles appear in the feed as their fallback version,
    // matching what the site itself serves at that URL.
    items: posts.map(({ entry }) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: localizePath(`/blog/${postSlug(entry)}`, lang),
      categories: [...entry.data.tags],
    })),
    customData: `<language>${LOCALE_TAGS[lang]}</language>`,
  })
}
