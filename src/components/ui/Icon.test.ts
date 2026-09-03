import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { describe, expect, it } from "vitest"

import Icon from "./Icon.astro"

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create()
  return container.renderToString(Icon, { props })
}

describe("Icon", () => {
  it("draws the requested icon", async () => {
    const html = await render({ name: "sun" })
    expect(html).toContain("<svg")
    expect(html).toContain("<circle")
  })

  it("is hidden from assistive tech unless given a label", async () => {
    expect(await render({ name: "moon" })).toContain('aria-hidden="true"')

    const labelled = await render({ name: "moon", label: "Dark theme" })
    expect(labelled).toContain('aria-label="Dark theme"')
    expect(labelled).toContain('role="img"')
    expect(labelled).not.toContain("aria-hidden")
  })

  it("forwards data attributes to the rendered SVG", async () => {
    // Regression test. Icon used to accept only `name`, `class` and `label`
    // and silently dropped everything else, so the theme toggle's
    // `data-theme-icon` hook never reached the DOM — the CSS that shows one
    // icon and hides the other two matched nothing, and all three rendered
    // at once. Nothing failed loudly; it just looked broken.
    const html = await render({ name: "monitor", "data-theme-icon": "system" })
    expect(html).toContain('data-theme-icon="system"')
  })

  it("keeps the caller's class", async () => {
    expect(await render({ name: "check", class: "size-4" })).toContain("size-4")
  })
})
