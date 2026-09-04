import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The translation-fallback rules, tested without a build.
 *
 * `astro:content` is mocked rather than stubbed with fixtures on disk: what
 * matters here is which entry wins for a given locale, not that Markdown
 * parses. The entries below are the smallest thing shaped like a collection
 * entry that these functions read.
 */
interface FakeEntry {
  id: string
  data: {
    lang: "en" | "id"
    translationKey: string
    title: string
    description: string
    pubDate: Date
    tags: string[]
    draft?: boolean
  }
  minutesRead?: unknown
}

let entries: FakeEntry[] = []

vi.mock("astro:content", () => ({
  getCollection: vi.fn(
    async (_collection: string, filter?: (entry: FakeEntry) => boolean) =>
      filter ? entries.filter(filter) : entries
  ),
  render: vi.fn(async (entry: FakeEntry) => ({
    remarkPluginFrontmatter: { minutesRead: entry.minutesRead },
  })),
}))

const {
  getPost,
  getPostListItems,
  getPostListItemsByTag,
  getPostRoutes,
  getPosts,
  getTags,
  postSlug,
} = await import("./queries")

let n = 0
const post = (
  overrides: Partial<FakeEntry["data"]> & { minutesRead?: unknown } = {}
) => {
  const { minutesRead, ...data } = overrides
  n += 1
  const entry: FakeEntry = {
    id: `post-${n}`,
    minutesRead,
    data: {
      lang: "en",
      translationKey: `key-${n}`,
      title: `Title ${n}`,
      description: `Description ${n}`,
      pubDate: new Date(`2026-01-${String(n).padStart(2, "0")}T00:00:00Z`),
      tags: [],
      ...data,
    },
  }
  return entry
}

beforeEach(() => {
  entries = []
  n = 0
})

describe("getPosts", () => {
  it("prefers the reader's own locale", async () => {
    entries = [
      post({ lang: "en", translationKey: "shared", title: "English" }),
      post({ lang: "id", translationKey: "shared", title: "Indonesian" }),
    ]
    const [only] = await getPosts("id")
    expect(only?.entry.data.title).toBe("Indonesian")
    expect(only?.isFallback).toBe(false)
  })

  it("falls back to the default locale and says so", async () => {
    entries = [post({ lang: "en", translationKey: "untranslated" })]
    const [only] = await getPosts("id")
    expect(only?.entry.data.lang).toBe("en")
    expect(only?.isFallback).toBe(true)
  })

  it("omits an article that exists in neither the locale nor the default", async () => {
    entries = [post({ lang: "id", translationKey: "id-only" })]
    expect(await getPosts("id")).toHaveLength(1)
    // Nothing to fall back to, so English simply does not list it.
    expect(await getPosts("en")).toHaveLength(0)
  })

  it("reports the locales an article genuinely exists in", async () => {
    entries = [
      post({ lang: "en", translationKey: "both" }),
      post({ lang: "id", translationKey: "both" }),
      post({ lang: "en", translationKey: "english-only" }),
    ]
    const posts = await getPosts("en")
    const both = posts.find((p) => p.entry.data.translationKey === "both")
    const single = posts.find(
      (p) => p.entry.data.translationKey === "english-only"
    )
    expect(both?.availableLocales).toEqual(["en", "id"])
    expect(single?.availableLocales).toEqual(["en"])
  })

  it("excludes drafts", async () => {
    entries = [
      post({ translationKey: "published" }),
      post({ translationKey: "hidden", draft: true }),
    ]
    const posts = await getPosts("en")
    expect(posts.map((p) => p.entry.data.translationKey)).toEqual(["published"])
  })

  it("returns newest first", async () => {
    entries = [
      post({ translationKey: "old", pubDate: new Date("2026-01-01") }),
      post({ translationKey: "new", pubDate: new Date("2026-06-01") }),
      post({ translationKey: "middle", pubDate: new Date("2026-03-01") }),
    ]
    const posts = await getPosts("en")
    expect(posts.map((p) => p.entry.data.translationKey)).toEqual([
      "new",
      "middle",
      "old",
    ])
  })
})

describe("getPost", () => {
  it("finds an article by its shared slug", async () => {
    entries = [post({ translationKey: "preview-urls" })]
    const found = await getPost("en", "preview-urls")
    expect(found && postSlug(found.entry)).toBe("preview-urls")
  })

  it("returns undefined for an unknown slug", async () => {
    entries = [post({ translationKey: "preview-urls" })]
    expect(await getPost("en", "nope")).toBeUndefined()
  })
})

describe("getPostRoutes", () => {
  it("emits the fallback URL as well as the translated one", async () => {
    entries = [post({ lang: "en", translationKey: "only-english" })]
    const routes = await getPostRoutes()
    expect(routes.map((r) => `${r.lang}:${r.slug}`)).toEqual([
      "en:only-english",
      "id:only-english",
    ])
    expect(routes.find((r) => r.lang === "id")?.post.isFallback).toBe(true)
  })
})

describe("getPostListItems", () => {
  it("carries the reading time the Sätteri plugin wrote", async () => {
    entries = [post({ minutesRead: 7 })]
    const [item] = await getPostListItems("en")
    expect(item?.minutesRead).toBe(7)
  })

  it("reports no reading time rather than a wrong one", async () => {
    // The plugin does not run in every environment, and a non-numeric value
    // rendered directly would put "NaN min read" on the page.
    entries = [post({ minutesRead: undefined }), post({ minutesRead: "12" })]
    const items = await getPostListItems("en")
    expect(items.map((i) => i.minutesRead)).toEqual([undefined, undefined])
  })
})

describe("getTags", () => {
  it("counts each tag and sorts by how often it is used", async () => {
    entries = [
      post({ tags: ["deployment", "process"] }),
      post({ tags: ["deployment"] }),
    ]
    expect(await getTags("en")).toEqual([
      { label: "deployment", slug: "deployment", count: 2 },
      { label: "process", slug: "process", count: 1 },
    ])
  })

  it("groups tags that differ only in casing", async () => {
    entries = [post({ tags: ["Deployment"] }), post({ tags: ["deployment"] })]
    const tags = await getTags("en")
    expect(tags).toHaveLength(1)
    expect(tags[0]?.count).toBe(2)
  })

  it("sees only the tags of the locale being read", async () => {
    entries = [
      post({ lang: "en", translationKey: "shared", tags: ["process"] }),
      post({ lang: "id", translationKey: "shared", tags: ["proses"] }),
    ]
    expect((await getTags("en")).map((t) => t.slug)).toEqual(["process"])
    expect((await getTags("id")).map((t) => t.slug)).toEqual(["proses"])
  })
})

describe("getPostListItemsByTag", () => {
  it("narrows the list to one tag", async () => {
    entries = [
      post({ translationKey: "a", tags: ["deployment"] }),
      post({ translationKey: "b", tags: ["process"] }),
    ]
    const items = await getPostListItemsByTag("en", "deployment")
    expect(items.map((i) => i.slug)).toEqual(["a"])
  })

  it("matches on the slug, not the authored casing", async () => {
    entries = [post({ translationKey: "a", tags: ["Continuous Delivery"] })]
    const items = await getPostListItemsByTag("en", "continuous-delivery")
    expect(items).toHaveLength(1)
  })
})
