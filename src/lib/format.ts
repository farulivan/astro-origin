/**
 * Presentation formatters. Business rules never live here.
 *
 * `hotel-dashboard` could hold its `Intl` objects in module-level constants
 * because it had exactly one locale. With several, the equivalent is a small
 * cache: constructing an `Intl.DateTimeFormat` is genuinely expensive, and a
 * blog index would otherwise build one per row per render.
 */
import { LOCALE_TAGS, type Locale } from "../content/schemas"

const dateFormatters = new Map<string, Intl.DateTimeFormat>()

function dateFormatter(
  lang: Locale,
  options: Intl.DateTimeFormatOptions,
  cacheKey: string
): Intl.DateTimeFormat {
  const key = `${lang}:${cacheKey}`
  let formatter = dateFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LOCALE_TAGS[lang], options)
    dateFormatters.set(key, formatter)
  }
  return formatter
}

/** "3 September 2026" / "3 September 2026" — long form, for post headers. */
export function formatDate(date: Date, lang: Locale): string {
  return dateFormatter(
    lang,
    { day: "numeric", month: "long", year: "numeric" },
    "long"
  ).format(date)
}

/** "3 Sep 2026" — compact form, for list rows. */
export function formatDateShort(date: Date, lang: Locale): string {
  return dateFormatter(
    lang,
    { day: "numeric", month: "short", year: "numeric" },
    "short"
  ).format(date)
}

/** Machine-readable value for <time datetime="…">. */
export function toDateAttribute(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()

/** Whole-dollar pricing; fractional cents never appear on a pricing table. */
export function formatPrice(amount: number, lang: Locale): string {
  const key = `${lang}:usd`
  let formatter = currencyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE_TAGS[lang], {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    })
    currencyFormatters.set(key, formatter)
  }
  return formatter.format(amount)
}

export interface PostDates {
  pubDate: Date
  /** Explicit frontmatter value; authoritative when present. */
  updatedDate?: Date | undefined
  /** Git-derived ISO string injected at build time; unreliable on hosts that shallow-clone. */
  lastModified?: string | undefined
}

export interface ResolvedPostDate {
  date: Date
  /** "updated" when the post has been revised since publication. */
  kind: "published" | "updated"
}

/**
 * The single place that decides which date a post displays.
 *
 * Precedence is frontmatter `updatedDate`, then the git-derived timestamp,
 * then the publication date. Explicit frontmatter wins because hosts that
 * shallow-clone the repository — Vercel clones at depth 2 and does not allow
 * changing it — resolve `git log` to a valid but wrong commit. An update that
 * is not actually later than publication is ignored rather than displayed.
 */
export function resolvePostDate({
  pubDate,
  updatedDate,
  lastModified,
}: PostDates): ResolvedPostDate {
  const candidate =
    updatedDate ?? (lastModified ? new Date(lastModified) : undefined)

  const isUsable =
    candidate !== undefined &&
    !Number.isNaN(candidate.getTime()) &&
    candidate.getTime() > pubDate.getTime()

  return isUsable
    ? { date: candidate, kind: "updated" }
    : { date: pubDate, kind: "published" }
}
