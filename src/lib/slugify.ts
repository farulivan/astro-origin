/**
 * URL-safe form of an authored string.
 *
 * Tags are written per locale — "deployment" in English, "penerapan" in
 * Indonesian — so this runs over words a human typed, in whatever script that
 * locale uses, not over identifiers.
 */

/**
 * Latin letters that are letters in their own right rather than an accented
 * base, so Unicode decomposition leaves them whole and the strip below would
 * delete them: "Ærø" would become "r". Everything here has a conventional
 * romanization; anything that does not is handled by the fallback in
 * `slugify`.
 */
const LATIN_EXTRAS: Record<string, string> = {
  æ: "ae",
  œ: "oe",
  ø: "o",
  đ: "d",
  ð: "d",
  ł: "l",
  ß: "ss",
  þ: "th",
  ı: "i",
}

/** Derived from the map above so the two cannot drift apart. */
const LATIN_EXTRAS_PATTERN = new RegExp(
  `[${Object.keys(LATIN_EXTRAS).join("")}]`,
  "g"
)

export function slugify(value: string): string {
  const ascii = value
    .toLowerCase()
    .replace(LATIN_EXTRAS_PATTERN, (char) => LATIN_EXTRAS[char] ?? char)
    .normalize("NFKD")
    // Combining marks left behind by the decomposition above, so an accented
    // word reduces to its unaccented form instead of breaking in two.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  // A tag written entirely in a non-Latin script reduces to nothing above.
  // Percent-encoding keeps it addressable; without this fallback every such
  // tag would collapse onto the same empty route.
  return ascii || encodeURIComponent(value.trim().toLowerCase())
}
