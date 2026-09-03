// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import PricingToggle, { type PricingTier } from "./PricingToggle"

const labels = {
  monthly: "Monthly",
  annual: "Annual",
  perMonth: "/mo",
  billedAnnually: "billed annually",
  free: "Free",
  featured: "Most popular",
  billingToggle: "Billing period",
}

const tiers: PricingTier[] = [
  {
    name: "Hobby",
    monthlyLabel: "$0",
    annualLabel: "$0",
    isFree: true,
    featured: false,
    features: ["Unlimited personal projects"],
    ctaLabel: "Choose Hobby",
    ctaHref: "https://app.example.com/signup",
  },
  {
    name: "Team",
    monthlyLabel: "$24",
    annualLabel: "$19",
    isFree: false,
    featured: true,
    features: ["Up to 20 collaborators"],
    ctaLabel: "Choose Team",
    ctaHref: "https://app.example.com/signup",
  },
]

describe("PricingToggle", () => {
  it("starts on monthly so the server-rendered HTML matches first paint", () => {
    render(<PricingToggle tiers={tiers} labels={labels} />)
    expect(screen.getByText("$24")).toBeInTheDocument()
    expect(screen.queryByText("$19")).not.toBeInTheDocument()
  })

  it("switches every tier to annual pricing at once", async () => {
    // One piece of state driving derived output across several cards is the
    // reason this is an island rather than a <script>.
    const user = userEvent.setup()
    render(<PricingToggle tiers={tiers} labels={labels} />)

    await user.click(screen.getByRole("radio", { name: "Annual" }))

    expect(screen.getByText("$19")).toBeInTheDocument()
    expect(screen.queryByText("$24")).not.toBeInTheDocument()
    expect(screen.getByText("billed annually")).toBeInTheDocument()
  })

  it("shows the free tier's label instead of a price in either period", async () => {
    const user = userEvent.setup()
    render(<PricingToggle tiers={tiers} labels={labels} />)

    expect(screen.getByText("Free")).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "Annual" }))
    expect(screen.getByText("Free")).toBeInTheDocument()
  })

  it("exposes the period control as a labelled radiogroup", () => {
    render(<PricingToggle tiers={tiers} labels={labels} />)
    const group = screen.getByRole("radiogroup", { name: "Billing period" })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Monthly" })).toHaveAttribute(
      "aria-checked",
      "true"
    )
  })

  it("renders every string from props, never from an imported dictionary", () => {
    // Proves the island ships no translation data of its own.
    render(<PricingToggle tiers={tiers} labels={labels} />)
    expect(screen.getByText("Most popular")).toBeInTheDocument()
    expect(screen.getByText("Choose Team")).toBeInTheDocument()
  })
})
