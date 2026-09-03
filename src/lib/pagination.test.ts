import { describe, expect, it } from "vitest"

import { blogPageHref, extraPageNumbers, paginate } from "./pagination"

const items = Array.from({ length: 7 }, (_, i) => i + 1)

describe("paginate", () => {
  it("slices the requested page", () => {
    expect(paginate(items, 1, 3).items).toEqual([1, 2, 3])
    expect(paginate(items, 3, 3).items).toEqual([7])
  })

  it("reports the page count", () => {
    expect(paginate(items, 1, 3).total).toBe(3)
  })

  it("clamps out-of-range pages instead of returning nothing", () => {
    expect(paginate(items, 0, 3).current).toBe(1)
    expect(paginate(items, 99, 3).current).toBe(3)
  })

  it("treats an empty collection as one empty page", () => {
    // Guards a divide-by-zero-shaped bug: `total: 0` would render
    // "Page 1 of 0" and break the pagination controls.
    expect(paginate([], 1, 3)).toEqual({ items: [], current: 1, total: 1 })
  })
})

describe("extraPageNumbers", () => {
  it("omits page 1, which lives at /blog rather than /blog/page/1", () => {
    expect(extraPageNumbers(7, 3)).toEqual([2, 3])
  })

  it("returns nothing when everything fits on one page", () => {
    expect(extraPageNumbers(3, 3)).toEqual([])
    expect(extraPageNumbers(0, 3)).toEqual([])
  })
})

describe("blogPageHref", () => {
  it("keeps page 1 at the bare blog URL", () => {
    expect(blogPageHref("en", 1)).toBe("/blog")
    expect(blogPageHref("id", 1)).toBe("/id/blog")
  })

  it("numbers later pages under /page", () => {
    expect(blogPageHref("en", 2)).toBe("/blog/page/2")
    expect(blogPageHref("id", 3)).toBe("/id/blog/page/3")
  })
})
