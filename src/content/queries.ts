/**
 * The content query layer — the only module besides pages that is allowed to
 * touch `getCollection`.
 *
 * It exists because three blog routes (index, paginated index, post) need the
 * same non-obvious rules: drop drafts, prefer the requested locale, fall back
 * to the default locale when a translation is missing, and key URLs off
 * `translationKey` so `/blog/x` and `/id/blog/x` are always the same article.
 * Duplicating that across three files is how the three quietly drift apart.
 *
 * Data access lives in one place, and pages compose it.
 */
import { getCollection, render, type CollectionEntry } from "astro:content"

import { slugify } from "@/lib/slugify"

import { DEFAULT_LOCALE, LOCALES, type Locale } from "./schemas"

export type PostEntry = CollectionEntry<"blog">

export interface LocalizedPost {
  entry: PostEntry
  /**
   * True when the requested locale has no translation and the default-locale
   * entry is standing in. The UI says so rather than switching silently.
   */
  isFallback: boolean
  /** Locales this article genuinely exists in — drives hreflang. */
  availableLocales: Locale[]
}

/** URL slug. Shared across locales so the language picker can stay on the page. */
export function postSlug(entry: PostEntry): string {
  return entry.data.translationKey
}

const newestFirst = (a: LocalizedPost, b: LocalizedPost) =>
  b.entry.data.pubDate.getTime() - a.entry.data.pubDate.getTime()

async function publishedPosts(): Promise<PostEntry[]> {
  return getCollection("blog", (entry) => entry.data.draft !== true)
}

/**
 * Every article visible in `lang`, newest first — its own translation where
 * one exists, the default-locale version marked as a fallback where it does
 * not. An article missing from both is simply absent.
 */
export async function getPosts(lang: Locale): Promise<LocalizedPost[]> {
  const all = await publishedPosts()

  const byKey = new Map<string, PostEntry[]>()
  for (const entry of all) {
    const bucket = byKey.get(entry.data.translationKey)
    if (bucket) bucket.push(entry)
    else byKey.set(entry.data.translationKey, [entry])
  }

  const posts: LocalizedPost[] = []
  for (const entries of byKey.values()) {
    const translated = entries.find((entry) => entry.data.lang === lang)
    const fallback = entries.find((entry) => entry.data.lang === DEFAULT_LOCALE)
    const entry = translated ?? fallback
    if (!entry) continue

    posts.push({
      entry,
      isFallback: translated === undefined,
      availableLocales: LOCALES.filter((locale) =>
        entries.some((candidate) => candidate.data.lang === locale)
      ),
    })
  }

  return posts.sort(newestFirst)
}

export async function getPost(
  lang: Locale,
  slug: string
): Promise<LocalizedPost | undefined> {
  const posts = await getPosts(lang)
  return posts.find((post) => postSlug(post.entry) === slug)
}

/** Every (locale, slug) pair the blog should generate. */
export async function getPostRoutes(): Promise<
  { lang: Locale; slug: string; post: LocalizedPost }[]
> {
  const routes: { lang: Locale; slug: string; post: LocalizedPost }[] = []
  for (const lang of LOCALES) {
    for (const post of await getPosts(lang)) {
      routes.push({ lang, slug: postSlug(post.entry), post })
    }
  }
  return routes
}

/** Shape the blog list renders. Kept here so both index routes agree on it. */
export interface PostListItem {
  slug: string
  title: string
  description: string
  date: Date
  minutesRead: number | undefined
  tags: readonly string[]
}

/**
 * Reading time is written into frontmatter by the Sätteri plugin and is only
 * readable after `render()`, so the list renders each entry to reach it. At
 * static-build time over a blog-sized collection that is a non-issue; if a
 * collection ever grew large enough for it to matter, the fix is to move the
 * count into the loader rather than to drop the feature.
 */
export async function getPostListItems(lang: Locale): Promise<PostListItem[]> {
  const posts = await getPosts(lang)

  return Promise.all(
    posts.map(async ({ entry }) => {
      const { remarkPluginFrontmatter } = await render(entry)
      const minutesRead = remarkPluginFrontmatter.minutesRead

      return {
        slug: postSlug(entry),
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.pubDate,
        minutesRead: typeof minutesRead === "number" ? minutesRead : undefined,
        tags: entry.data.tags,
      }
    })
  )
}

/** A tag as it appears in one locale, with the route it addresses. */
export interface TagSummary {
  /** As authored, for display. */
  label: string
  /** URL-safe form. */
  slug: string
  count: number
}

/**
 * Tags are authored per locale, so a tag has no cross-locale identity: the
 * English post carries "deployment" and the Indonesian one "penerapan". That
 * is why tag routes are generated per locale and why the language picker on a
 * tag page falls back to the blog index rather than switching to a URL that
 * would not exist.
 */
export async function getTags(lang: Locale): Promise<TagSummary[]> {
  const posts = await getPosts(lang)

  const bySlug = new Map<string, TagSummary>()
  for (const { entry } of posts) {
    for (const label of entry.data.tags) {
      const slug = slugify(label)
      const seen = bySlug.get(slug)
      if (seen) seen.count += 1
      else bySlug.set(slug, { label, slug, count: 1 })
    }
  }

  return [...bySlug.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  )
}

/** The blog list, narrowed to one tag. */
export async function getPostListItemsByTag(
  lang: Locale,
  tagSlug: string
): Promise<PostListItem[]> {
  const items = await getPostListItems(lang)
  return items.filter((item) =>
    item.tags.some((tag) => slugify(tag) === tagSlug)
  )
}
