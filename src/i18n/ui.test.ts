import { describe, expect, it } from "vitest"

import { LOCALES } from "@/content/schemas"

import { en, ui } from "./ui"

/**
 * Key completeness is already a compile-time guarantee: `id` is typed
 * `Record<TranslationKey, string>`, so a missing key fails `astro check`.
 * These tests cover what types cannot — that no locale was filled in with
 * placeholders, copied English, or an unsubstituted placeholder token.
 */
describe("translation dictionaries", () => {
  const keys = Object.keys(en) as (keyof typeof en)[]

  it("covers every declared locale", () => {
    for (const locale of LOCALES) {
      expect(ui[locale], `missing dictionary for "${locale}"`).toBeDefined()
    }
  })

  it("has no empty strings in any locale", () => {
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(ui[locale][key].trim(), `${locale}.${key} is empty`).not.toBe("")
      }
    }
  })

  it("declares the same placeholder tokens in every locale", () => {
    // A translation that drops "{minutes}" renders a sentence with a hole in
    // it — visible only on that locale's pages, which is exactly the bug a
    // human reviewer misses.
    const tokensOf = (value: string) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

    for (const key of keys) {
      const expected = tokensOf(en[key])
      for (const locale of LOCALES) {
        expect(tokensOf(ui[locale][key]), `${locale}.${key}`).toEqual(expected)
      }
    }
  })

  it("actually translates the non-default locales", () => {
    // Proper nouns and loanwords legitimately match across languages, so this
    // asserts on the overall share rather than on any single key.
    const translatable = keys.filter((key) => ui.id[key] !== en[key])
    expect(translatable.length / keys.length).toBeGreaterThan(0.8)
  })
})
