/**
 * Pagination arithmetic and URL shape, kept pure and in one place.
 *
 * Written by hand rather than with Astro's `paginate()` helper for one
 * reason: `paginate()` puts page 1 at `/blog/1`, and we want it at `/blog`
 * with only later pages under `/blog/page/N`. Bending the helper into that
 * shape is more code than the arithmetic it would have saved.
 */
import type { Locale } from "@/content/schemas"
import { localizePath } from "@/i18n/utils"

export interface Paginated<T> {
  items: T[]
  current: number
  total: number
}

export function paginate<T>(
  items: readonly T[],
  current: number,
  perPage: number
): Paginated<T> {
  const total = Math.max(1, Math.ceil(items.length / perPage))
  const page = Math.min(Math.max(1, current), total)
  const start = (page - 1) * perPage
  return { items: items.slice(start, start + perPage), current: page, total }
}

/** Page numbers that need their own route — page 1 lives at /blog. */
export function extraPageNumbers(itemCount: number, perPage: number): number[] {
  const total = Math.max(1, Math.ceil(itemCount / perPage))
  return Array.from({ length: Math.max(0, total - 1) }, (_, i) => i + 2)
}

export function blogPageHref(lang: Locale, page: number): string {
  return localizePath(page <= 1 ? "/blog" : `/blog/page/${page}`, lang)
}
