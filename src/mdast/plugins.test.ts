import { describe, expect, it, vi } from "vitest"

import { externalLinksPlugin } from "./external-links"
import { modifiedTimePlugin } from "./modified-time"
import { readingTimePlugin } from "./reading-time"

/**
 * Sätteri plugins are plain objects whose hooks take the node and a context,
 * so they can be called directly. That is the whole reason to write them this
 * way: no build, no dev server, no Markdown file on disk.
 */
const astroData = (frontmatter: Record<string, unknown> = {}) => ({
  astro: { frontmatter },
})

describe("reading-time", () => {
  const run = (text: string, frontmatter: Record<string, unknown> = {}) => {
    const data = astroData(frontmatter)
    readingTimePlugin.after?.(
      {} as never,
      {
        data,
        textContent: () => text,
      } as never
    )
    return data.astro.frontmatter
  }

  it("writes a minute count that grows with the text", () => {
    // Asserting the contract rather than the library's words-per-minute
    // constant, which is not ours to pin.
    const short = run("word ".repeat(200)).minutesRead as number
    const long = run("word ".repeat(2000)).minutesRead as number
    expect(short).toBeGreaterThanOrEqual(1)
    expect(long).toBeGreaterThan(short)
  })

  it("never reports zero minutes for a short post", () => {
    expect(run("three words here").minutesRead).toBe(1)
  })

  it("stores a number, leaving the wording to the dictionary", () => {
    expect(typeof run("word ".repeat(300)).minutesRead).toBe("number")
  })

  it("does nothing when Astro exposed no frontmatter", () => {
    expect(() =>
      readingTimePlugin.after?.(
        {} as never,
        {
          data: {},
          textContent: () => "text",
        } as never
      )
    ).not.toThrow()
  })
})

describe("modified-time", () => {
  /**
   * The documented contract. A tarball export, a shallow clone or a file that
   * was never committed must all still build — this plugin is a fallback, and
   * a fallback that throws is worse than no fallback.
   */
  it("does not throw when git cannot answer", () => {
    const data = astroData()
    expect(() =>
      modifiedTimePlugin.before?.(
        {} as never,
        {
          data,
          fileURL: new URL("file:///nonexistent/not-a-repo/post.mdx"),
        } as never
      )
    ).not.toThrow()
    expect(data.astro.frontmatter.lastModified).toBeUndefined()
  })

  it("does nothing without a file URL", () => {
    const data = astroData()
    modifiedTimePlugin.before?.({} as never, { data } as never)
    expect(data.astro.frontmatter.lastModified).toBeUndefined()
  })
})

describe("external-links", () => {
  const run = (url: string, frontmatter: Record<string, unknown> = {}) => {
    const setProperty = vi.fn()
    const appendChild = vi.fn()
    externalLinksPlugin.link?.(
      { url, data: {} } as never,
      {
        data: astroData(frontmatter),
        setProperty,
        appendChild,
      } as never
    )
    return { setProperty, appendChild }
  }

  it("marks an external link and opens it safely", () => {
    const { setProperty } = run("https://example.com/docs")
    expect(setProperty).toHaveBeenCalledTimes(1)
    const [, , value] = setProperty.mock.calls[0]!
    expect(value.hProperties).toMatchObject({
      target: "_blank",
      rel: "noopener noreferrer",
      "data-external": "true",
    })
  })

  it("leaves relative links alone", () => {
    const { setProperty, appendChild } = run("/blog/preview-urls")
    expect(setProperty).not.toHaveBeenCalled()
    expect(appendChild).not.toHaveBeenCalled()
  })

  it("leaves anchors and mailto links alone", () => {
    expect(run("#pricing").setProperty).not.toHaveBeenCalled()
    expect(run("mailto:hi@example.com").setProperty).not.toHaveBeenCalled()
  })

  it("announces the new tab in the post's own language", () => {
    const english = run("https://example.com", { lang: "en" })
    expect(english.appendChild.mock.calls[0]![1].raw).toContain("new tab")

    const indonesian = run("https://example.com", { lang: "id" })
    const raw = indonesian.appendChild.mock.calls[0]![1].raw
    expect(raw).toContain("sr-only")
    expect(raw).not.toContain("new tab")
  })

  it("falls back to the default locale when frontmatter has no lang", () => {
    const { appendChild } = run("https://example.com", {})
    expect(appendChild.mock.calls[0]![1].raw).toContain("new tab")
  })

  /**
   * The note is a raw HTML string. Left as MDX, its braces would be parsed as
   * an expression and the build would fail on a post that links out.
   */
  it("does not let the injected HTML be parsed as MDX", () => {
    const { appendChild } = run("https://example.com")
    expect(appendChild.mock.calls[0]![1].mdxExpressions).toBe(false)
  })
})
