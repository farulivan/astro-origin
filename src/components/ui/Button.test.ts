import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { describe, expect, it } from "vitest"

import Button from "./Button.astro"

/**
 * Astro's Container API renders a component to a string with no browser and
 * no dev server. That is only possible because these primitives are
 * props-in/HTML-out — the moment a component fetches its own data, this kind
 * of test stops being cheap.
 */
const render = async (props: Record<string, unknown>, slot = "Continue") => {
  const container = await AstroContainer.create()
  return container.renderToString(Button, { props, slots: { default: slot } })
}

describe("Button", () => {
  it("renders a button element by default", async () => {
    const html = await render({})
    expect(html).toContain("<button")
    expect(html).toContain('type="button"')
    expect(html).toContain("Continue")
  })

  it("renders an anchor when given href", async () => {
    // A call to action that navigates must stay a real link, so middle-click,
    // cmd-click and "copy link address" keep working.
    const html = await render({ href: "/pricing" })
    expect(html).toContain("<a")
    expect(html).toContain('href="/pricing"')
    expect(html).not.toContain("<button")
  })

  it("applies variant and size classes", async () => {
    const html = await render({ variant: "outline", size: "lg" })
    expect(html).toContain("border")
    expect(html).toContain("h-12")
  })

  it("merges a caller's classes rather than dropping them", async () => {
    const html = await render({ class: "mt-8" })
    expect(html).toContain("mt-8")
  })

  it("passes through accessibility attributes", async () => {
    const html = await render({ "aria-label": "Open pricing" })
    expect(html).toContain('aria-label="Open pricing"')
  })
})
