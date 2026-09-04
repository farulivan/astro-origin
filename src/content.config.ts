/**
 * Wiring only — no rules live here.
 *
 * Each collection pairs a loader (where the content comes from) with a schema
 * (what counts as valid). Because the schemas are a separate pure module,
 * moving to a CMS is a change to the `loader` lines alone: no schema moves, no
 * component moves, no page moves. The content boundary does here what a
 * network boundary does in an application that talks to a server.
 */
import { defineCollection } from "astro:content"
import { file, glob } from "astro/loaders"

import {
  faqSchema,
  featureSchema,
  postSchema,
  pricingSchema,
  testimonialSchema,
} from "./content/schemas"

/** Locale lives in frontmatter, so these folders are organization only. */
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.mdx" }),
  schema: postSchema,
})

const features = defineCollection({
  loader: glob({ base: "./src/content/features", pattern: "**/*.md" }),
  schema: featureSchema,
})

const testimonials = defineCollection({
  loader: glob({ base: "./src/content/testimonials", pattern: "**/*.md" }),
  schema: testimonialSchema,
})

const faq = defineCollection({
  loader: file("./src/content/faq.json"),
  schema: faqSchema,
})

const pricing = defineCollection({
  loader: file("./src/content/pricing.json"),
  schema: pricingSchema,
})

export const collections = { blog, features, testimonials, faq, pricing }
