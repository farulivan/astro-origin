import { describe, expect, it } from "vitest"

import {
  formatDate,
  formatDateShort,
  formatPrice,
  resolvePostDate,
  toDateAttribute,
} from "./format"

describe("resolvePostDate", () => {
  const pubDate = new Date("2026-01-10T00:00:00Z")

  it("shows the publication date when nothing newer exists", () => {
    expect(resolvePostDate({ pubDate })).toEqual({
      date: pubDate,
      kind: "published",
    })
  })

  it("prefers explicit frontmatter over the git timestamp", () => {
    // This precedence is the whole point: hosts that shallow-clone (Vercel
    // clones at depth 2 and will not let you change it) resolve `git log` to
    // the wrong commit, so an author's explicit date has to win.
    const updatedDate = new Date("2026-03-01T00:00:00Z")
    const result = resolvePostDate({
      pubDate,
      updatedDate,
      lastModified: "2026-09-09T00:00:00Z",
    })
    expect(result).toEqual({ date: updatedDate, kind: "updated" })
  })

  it("falls back to the git timestamp when frontmatter is absent", () => {
    const result = resolvePostDate({
      pubDate,
      lastModified: "2026-02-02T00:00:00Z",
    })
    expect(result.kind).toBe("updated")
    expect(result.date.toISOString()).toBe("2026-02-02T00:00:00.000Z")
  })

  it("ignores an update that predates publication", () => {
    // A shallow clone reports the checkout commit, which is frequently older
    // than the post. Showing "Updated" with an earlier date is worse than
    // showing nothing.
    const result = resolvePostDate({
      pubDate,
      lastModified: "2020-01-01T00:00:00Z",
    })
    expect(result).toEqual({ date: pubDate, kind: "published" })
  })

  it("ignores an unparseable git timestamp", () => {
    const result = resolvePostDate({ pubDate, lastModified: "not a date" })
    expect(result).toEqual({ date: pubDate, kind: "published" })
  })
})

describe("date formatting", () => {
  const date = new Date("2026-03-05T12:00:00Z")

  it("renders in the active locale", () => {
    expect(formatDate(date, "en")).toContain("March")
    expect(formatDate(date, "id")).toContain("Maret")
  })

  it("has a short form for list rows", () => {
    expect(formatDateShort(date, "en")).toMatch(/Mar/)
  })

  it("emits a machine-readable datetime attribute", () => {
    expect(toDateAttribute(date)).toBe("2026-03-05")
  })
})

describe("formatPrice", () => {
  it("renders whole dollars without cents", () => {
    expect(formatPrice(24, "en")).toBe("$24")
  })

  it("renders zero rather than an empty string", () => {
    expect(formatPrice(0, "en")).toBe("$0")
  })
})
