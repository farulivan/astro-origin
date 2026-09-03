/**
 * The content kernel.
 *
 * Every rule about what valid content looks like lives here, as plain Zod.
 * This module imports nothing but `astro/zod`, so it is fully unit-testable
 * without Astro, a DOM, or a build — and because both the build (through
 * `content.config.ts`) and the tests validate against these exact schemas,
 * they cannot disagree about what "correct content" means.
 *
 * `astro/zod` rather than a separate `zod` install: Astro bundles its own Zod
 * and passing a schema built by a different copy breaks `defineCollection`.
 */
import { z } from "astro/zod"

export const LOCALES = ["en", "id"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"

/** BCP-47 tags for `Intl`, `<html lang>`, hreflang and the sitemap. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  id: "id-ID",
}

/**
 * Search engines truncate titles past ~60 and descriptions past ~160
 * characters. Encoding those limits in the schema turns a soft SEO guideline
 * into a build failure, which is the only version anyone actually respects.
 */
const SEO_TITLE_MAX = 70
const SEO_DESCRIPTION_MIN = 50
const SEO_DESCRIPTION_MAX = 160

/** Fields every localized entry carries, whatever collection it belongs to. */
const localized = {
  /**
   * Stored explicitly rather than inferred from the folder path: the folders
   * are an organizational convenience, and deriving meaning from them would
   * make this schema depend on the loader's layout.
   */
  lang: z.enum(LOCALES),
  /**
   * Shared identifier linking an entry to its translations in other locales.
   * The language picker, the hreflang tags and the untranslated-fallback all
   * key off this rather than off the filename.
   */
  translationKey: z.string().min(1),
}

/**
 * `image()` is injected by Astro's schema callback — see content.config.ts.
 * Typed by its result (`ImageMetadata`, an ambient Astro global) rather than
 * imported from `astro:content`, which would cost this module its purity.
 */
type ImageHelper = () => z.ZodType<ImageMetadata>

export const postSchema = ({ image }: { image: ImageHelper }) =>
  z.object({
    ...localized,
    title: z.string().min(1).max(SEO_TITLE_MAX),
    description: z.string().min(SEO_DESCRIPTION_MIN).max(SEO_DESCRIPTION_MAX),
    pubDate: z.coerce.date(),
    /**
     * Authoritative "last updated" when present. The git-derived timestamp is
     * only a fallback, because hosts that shallow-clone (Vercel does, at
     * depth 2, and will not let you change it) report the wrong commit.
     */
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /**
     * `image()` validates the path and imports the asset, so `<Image>` can
     * emit real width/height and avoid layout shift. `alt` is required, which
     * makes an inaccessible image a build error rather than a review comment.
     */
    hero: z.object({ src: image(), alt: z.string().min(1) }).optional(),
  })

/** Icon names a feature may use; the Icon component must draw each one. */
export const FEATURE_ICONS = [
  "zap",
  "shield",
  "globe",
  "sparkles",
  "gauge",
  "layers",
] as const

export type FeatureIconName = (typeof FEATURE_ICONS)[number]

export const featureSchema = z.object({
  ...localized,
  title: z.string().min(1),
  description: z.string().min(1),
  /** Matches a key in the icon registry; unknown names fail at build. */
  icon: z.enum(FEATURE_ICONS),
  order: z.number().int().nonnegative().default(0),
})

export const testimonialSchema = z.object({
  ...localized,
  author: z.string().min(1),
  role: z.string().min(1),
  quote: z.string().min(1),
})

export const faqSchema = z.object({
  ...localized,
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int().nonnegative().default(0),
})

export const pricingSchema = z
  .object({
    ...localized,
    name: z.string().min(1),
    /** Monthly price in whole USD. 0 renders as the free tier. */
    monthly: z.number().nonnegative(),
    /**
     * Annual price *per month* when billed yearly. Must not exceed `monthly` —
     * an "annual discount" that costs more is a content bug, not a design one.
     */
    annual: z.number().nonnegative(),
    features: z.array(z.string().min(1)).min(1),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative().default(0),
  })
  .refine((tier) => tier.annual <= tier.monthly, {
    message: "Annual price per month must not exceed the monthly price",
    path: ["annual"],
  })
