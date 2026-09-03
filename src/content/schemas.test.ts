import { describe, expect, it } from "vitest"

import { faqSchema, postSchema, pricingSchema, LOCALES } from "./schemas"

/**
 * The kernel's tests. These are the counterpart of the sibling project's
 * status-machine tests: they pin down the rules that both the build and the
 * UI depend on, and they need no Astro, no DOM and no build to run.
 *
 * `image()` is supplied by Astro at build time, so it is stubbed here with a
 * schema that accepts anything — these tests are about the surrounding rules,
 * and image resolution is Astro's job, not ours.
 */
import { z } from "astro/zod"

const image = () => z.any() as never
const post = postSchema({ image })

const validPost = {
  lang: "en",
  translationKey: "hello",
  title: "A reasonable title",
  description:
    "A description comfortably inside the fifty-to-one-hundred-sixty character window search engines display.",
  pubDate: "2026-01-15",
}

describe("postSchema", () => {
  it("accepts a well-formed post and coerces the date", () => {
    const result = post.parse(validPost)
    expect(result.pubDate).toBeInstanceOf(Date)
    expect(result.pubDate.getUTCFullYear()).toBe(2026)
  })

  it("defaults draft to false and tags to an empty list", () => {
    const result = post.parse(validPost)
    expect(result.draft).toBe(false)
    expect(result.tags).toEqual([])
  })

  it("rejects a description below the SEO minimum", () => {
    expect(() =>
      post.parse({ ...validPost, description: "Too short." })
    ).toThrow()
  })

  it("rejects a description above the SEO maximum", () => {
    expect(() =>
      post.parse({ ...validPost, description: "x".repeat(161) })
    ).toThrow()
  })

  it("rejects a title longer than search engines will show", () => {
    expect(() => post.parse({ ...validPost, title: "x".repeat(71) })).toThrow()
  })

  it("rejects an unknown locale", () => {
    expect(() => post.parse({ ...validPost, lang: "fr" })).toThrow()
  })

  it("requires a translationKey, since URLs and hreflang are built from it", () => {
    expect(() => post.parse({ ...validPost, translationKey: "" })).toThrow()
  })

  it("requires alt text whenever a hero image is present", () => {
    expect(() =>
      post.parse({ ...validPost, hero: { src: "./a.png" } })
    ).toThrow()
    expect(() =>
      post.parse({ ...validPost, hero: { src: "./a.png", alt: "" } })
    ).toThrow()
    expect(
      post.parse({ ...validPost, hero: { src: "./a.png", alt: "A chart" } })
    ).toBeTruthy()
  })
})

describe("pricingSchema", () => {
  const tier = {
    lang: "en",
    translationKey: "team",
    name: "Team",
    monthly: 24,
    annual: 19,
    features: ["Everything in Hobby"],
  }

  it("accepts an annual price at or below the monthly price", () => {
    expect(pricingSchema.parse(tier)).toBeTruthy()
    expect(pricingSchema.parse({ ...tier, annual: 24 })).toBeTruthy()
  })

  it("rejects an annual price above the monthly one", () => {
    // An "annual discount" that costs more is a content bug, and the schema
    // is the only layer positioned to catch it before it ships.
    expect(() => pricingSchema.parse({ ...tier, annual: 25 })).toThrow()
  })

  it("requires at least one listed feature", () => {
    expect(() => pricingSchema.parse({ ...tier, features: [] })).toThrow()
  })

  it("rejects negative prices", () => {
    expect(() => pricingSchema.parse({ ...tier, monthly: -1 })).toThrow()
  })
})

describe("faqSchema", () => {
  it("defaults order so unordered entries still sort deterministically", () => {
    const parsed = faqSchema.parse({
      lang: "id",
      translationKey: "pricing",
      question: "Berapa harganya?",
      answer: "Mulai dari gratis.",
    })
    expect(parsed.order).toBe(0)
  })
})

describe("LOCALES", () => {
  it("lists the default locale first, which the fallback logic relies on", () => {
    expect(LOCALES[0]).toBe("en")
  })
})
