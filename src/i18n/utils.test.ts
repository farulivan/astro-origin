import { describe, expect, it } from "vitest"

import {
  getLangFromPath,
  isLocale,
  langParam,
  localizePath,
  stripLocale,
  switchLocalePath,
  useTranslations,
} from "./utils"

describe("getLangFromPath", () => {
  it("reads a prefixed locale", () => {
    expect(getLangFromPath("/id/blog")).toBe("id")
    expect(getLangFromPath("/id")).toBe("id")
  })

  it("treats an unprefixed path as the default locale", () => {
    expect(getLangFromPath("/")).toBe("en")
    expect(getLangFromPath("/blog")).toBe("en")
  })

  it("does not mistake an ordinary first segment for a locale", () => {
    // The bug this guards: a future page at /it/... or a slug that happens to
    // look like a language code silently switching the site's language.
    expect(getLangFromPath("/blog/id")).toBe("en")
    expect(getLangFromPath("/index")).toBe("en")
  })
})

describe("localizePath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localizePath("/blog", "en")).toBe("/blog")
    expect(localizePath("/", "en")).toBe("/")
  })

  it("prefixes other locales", () => {
    expect(localizePath("/blog", "id")).toBe("/id/blog")
    // No trailing slash: the site is configured trailingSlash: "never".
    expect(localizePath("/", "id")).toBe("/id")
  })

  it("normalizes duplicate and missing slashes", () => {
    expect(localizePath("blog", "id")).toBe("/id/blog")
    expect(localizePath("//blog//", "en")).toBe("/blog")
  })
})

describe("switchLocalePath", () => {
  it("keeps the reader on the same page", () => {
    // The classic bug in hand-rolled language switchers is dumping the reader
    // on the home page; this is the test that stops it coming back.
    expect(switchLocalePath("/blog/my-post", "id")).toBe("/id/blog/my-post")
    expect(switchLocalePath("/id/blog/my-post", "en")).toBe("/blog/my-post")
  })

  it("round-trips", () => {
    const original = "/blog/page/2"
    expect(switchLocalePath(switchLocalePath(original, "id"), "en")).toBe(
      original
    )
  })
})

describe("stripLocale", () => {
  it("removes only a leading locale segment", () => {
    expect(stripLocale("/id/blog")).toBe("/blog")
    expect(stripLocale("/blog")).toBe("/blog")
    expect(stripLocale("/blog/id")).toBe("/blog/id")
  })
})

describe("langParam", () => {
  it("is undefined for the default locale so the route stays unprefixed", () => {
    expect(langParam("en")).toBeUndefined()
    expect(langParam("id")).toBe("id")
  })
})

describe("isLocale", () => {
  it("rejects anything not declared", () => {
    expect(isLocale("en")).toBe(true)
    expect(isLocale("fr")).toBe(false)
    expect(isLocale(undefined)).toBe(false)
    expect(isLocale(42)).toBe(false)
  })
})

describe("useTranslations", () => {
  it("returns the string for the active locale", () => {
    expect(useTranslations("en")("nav.blog")).toBe("Blog")
    expect(useTranslations("id")("nav.features")).toBe("Fitur")
  })

  it("substitutes placeholders", () => {
    expect(useTranslations("en")("blog.readingTime", { minutes: 4 })).toBe(
      "4 min read"
    )
    expect(
      useTranslations("id")("pagination.status", { current: 2, total: 5 })
    ).toBe("Halaman 2 dari 5")
  })

  it("leaves an unsupplied placeholder intact rather than printing undefined", () => {
    expect(useTranslations("en")("blog.readingTime")).toBe("{minutes} min read")
  })
})

describe("localizePath with hashes and queries", () => {
  it("keeps an in-page anchor attached without a stray slash", () => {
    // "/id/#pricing" is what naive joining produces, and it appeared on every
    // Indonesian page's hero and closing call to action.
    expect(localizePath("/#pricing", "id")).toBe("/id#pricing")
    expect(localizePath("/#pricing", "en")).toBe("/#pricing")
  })

  it("handles an anchor on a nested path", () => {
    expect(localizePath("/blog#top", "id")).toBe("/id/blog#top")
    expect(localizePath("/blog#top", "en")).toBe("/blog#top")
  })

  it("preserves a query string", () => {
    expect(localizePath("/blog?tag=process", "id")).toBe("/id/blog?tag=process")
  })

  it("still returns the bare root", () => {
    expect(localizePath("/", "en")).toBe("/")
    expect(localizePath("/", "id")).toBe("/id")
  })
})
