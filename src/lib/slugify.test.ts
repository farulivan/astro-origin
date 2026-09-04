import { describe, expect, it } from "vitest"

import { slugify } from "./slugify"

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Preview URLs")).toBe("preview-urls")
  })

  it("strips accents rather than breaking the word in two", () => {
    expect(slugify("Café")).toBe("cafe")
    expect(slugify("Ærø")).toBe("aero")
  })

  it("collapses runs of punctuation and trims the ends", () => {
    expect(slugify("  --Continuous   delivery!--  ")).toBe(
      "continuous-delivery"
    )
  })

  it("is stable across the casing a writer might use", () => {
    expect(slugify("Deployment")).toBe(slugify("deployment"))
  })

  /**
   * Without the fallback every tag in a non-Latin script would reduce to the
   * empty string and collapse onto one route, silently merging unrelated tags.
   */
  it("keeps a non-Latin tag addressable instead of emptying it", () => {
    const slug = slugify("日本語")
    expect(slug).not.toBe("")
    expect(slugify("日本語")).toBe(slug)
    expect(slugify("한국어")).not.toBe(slug)
  })
})
