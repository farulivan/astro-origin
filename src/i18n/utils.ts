/**
 * Pure locale helpers. Imports only the two kernels, never Astro or a
 * component, so every function here is unit-testable in isolation.
 *
 * The URL shape these encode (`prefixDefaultLocale: false`):
 *   English      /            /blog        /blog/my-post
 *   Indonesian   /id/         /id/blog     /id/blog/my-post
 */
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_TAGS,
  type Locale,
} from "../content/schemas"

import { ui, type TranslationKey } from "./ui"

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  )
}

/**
 * Reads the active locale out of a pathname. The default locale has no
 * prefix, so anything unrecognized is simply the default rather than a 404 —
 * `/blog` and `/about` must not be mistaken for language codes.
 */
export function getLangFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0]
  return isLocale(first) ? first : DEFAULT_LOCALE
}

export function getLangFromUrl(url: URL): Locale {
  return getLangFromPath(url.pathname)
}

/**
 * Returns a lookup typed on `TranslationKey`, so a misspelled key fails
 * typecheck instead of rendering an empty string. `vars` fills `{token}`
 * placeholders.
 */
export function useTranslations(lang: Locale) {
  const dictionary = ui[lang]

  return function t(
    key: TranslationKey,
    vars?: Record<string, string | number>
  ): string {
    const template: string = dictionary[key]
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (match, token: string) =>
      token in vars ? String(vars[token]) : match
    )
  }
}

/** Strips a leading locale segment, returning the path without it. */
export function stripLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  if (isLocale(segments[0])) segments.shift()
  return `/${segments.join("/")}`
}

/**
 * Prefixes a locale-less path for the given locale. The default locale is
 * returned unprefixed, which is what makes `lang: undefined` in
 * `getStaticPaths` produce `/blog` rather than `/en/blog`.
 *
 * A hash or query string is split off first and re-attached afterwards, so
 * callers can pass "/#pricing" and get "/id#pricing" rather than the
 * "/id/#pricing" that naive path joining produces. Every in-page anchor on
 * the site goes through here, so getting this wrong shows up everywhere.
 */
export function localizePath(path: string, lang: Locale): string {
  const suffixAt = path.search(/[#?]/)
  const pathname = suffixAt === -1 ? path : path.slice(0, suffixAt)
  const suffix = suffixAt === -1 ? "" : path.slice(suffixAt)

  const clean = `/${pathname.split("/").filter(Boolean).join("/")}`
  // No trailing slash, matching `trailingSlash: "never"` in astro.config:
  // "/id", not "/id/".
  const prefix = lang === DEFAULT_LOCALE ? "" : `/${lang}`
  const rest = clean === "/" ? "" : clean

  const href = `${prefix}${rest}${suffix}`
  // Root plus a hash collapses to "#pricing" above; keep it absolute so the
  // same link works when rendered on a different page.
  return href.startsWith("/") ? href : `/${href}`
}

/** Same path, different locale — for the language picker. */
export function switchLocalePath(pathname: string, to: Locale): string {
  return localizePath(stripLocale(pathname), to)
}

/**
 * The `[...lang]` route param for a locale: `undefined` for the default (so
 * Astro emits the unprefixed route) and the code itself otherwise.
 */
export function langParam(lang: Locale): string | undefined {
  return lang === DEFAULT_LOCALE ? undefined : lang
}

export function localeTag(lang: Locale): string {
  return LOCALE_TAGS[lang]
}

export { DEFAULT_LOCALE, LOCALES, type Locale, type TranslationKey }
