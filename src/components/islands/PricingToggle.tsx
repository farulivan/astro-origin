import { useId, useState } from "react"

/**
 * The one React island in this project, and a deliberate illustration of when
 * an island is warranted: a single piece of state (the billing period) drives
 * derived output across every card at once. The theme toggle and mobile nav
 * next door are plain <script> precisely because they do not.
 *
 * Two properties keep it honest:
 *
 * 1. Prices arrive **pre-formatted** from the page. Currency formatting stays
 *    in src/lib/format.ts, server-side, so no Intl logic ships to the browser
 *    and there is still exactly one place that decides how money looks.
 * 2. Every string arrives as a prop. The island never imports the dictionary,
 *    so no translation data is shipped twice.
 *
 * Astro renders this to HTML at build time and hydrates on `client:visible`,
 * so the pricing table is in the source for crawlers and costs nothing until
 * it scrolls into view.
 */
export interface PricingTier {
  name: string
  monthlyLabel: string
  annualLabel: string
  isFree: boolean
  featured: boolean
  features: readonly string[]
  ctaLabel: string
  ctaHref: string
}

export interface PricingToggleProps {
  tiers: readonly PricingTier[]
  labels: {
    monthly: string
    annual: string
    perMonth: string
    billedAnnually: string
    free: string
    featured: string
    billingToggle: string
  }
}

type Period = "monthly" | "annual"

export default function PricingToggle({ tiers, labels }: PricingToggleProps) {
  const [period, setPeriod] = useState<Period>("monthly")
  const groupId = useId()

  return (
    <div>
      {/* A radiogroup rather than a switch: there are two named choices, and
          arrow-key navigation between them is what a screen reader expects. */}
      <div
        role="radiogroup"
        aria-label={labels.billingToggle}
        id={groupId}
        className="border-border bg-card mx-auto mb-10 inline-flex rounded-lg border p-1"
      >
        {(["monthly", "annual"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={period === value}
            onClick={() => setPeriod(value)}
            className={
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors " +
              (period === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {labels[value]}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <li
            key={tier.name}
            className={
              "bg-card text-card-foreground relative flex flex-col rounded-xl border p-6 " +
              (tier.featured ? "border-primary shadow-sm" : "border-border")
            }
          >
            {tier.featured && (
              <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {labels.featured}
              </span>
            )}

            <h3 className="font-medium">{tier.name}</h3>

            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {tier.isFree
                  ? labels.free
                  : period === "monthly"
                    ? tier.monthlyLabel
                    : tier.annualLabel}
              </span>
              {!tier.isFree && (
                <span className="text-muted-foreground text-sm">
                  {labels.perMonth}
                </span>
              )}
            </p>

            {/* Reserved whether or not it renders, so switching period cannot
                shift the card heights. */}
            <p className="text-muted-foreground mt-1 min-h-5 text-xs">
              {!tier.isFree && period === "annual" ? labels.billedAnnually : ""}
            </p>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href={tier.ctaHref}
              className={
                "mt-6 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors " +
                (tier.featured
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border-border hover:bg-accent hover:text-accent-foreground border")
              }
            >
              {tier.ctaLabel}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
