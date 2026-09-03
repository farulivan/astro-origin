/**
 * The translation kernel.
 *
 * `en` is the source of truth for which keys exist; `TranslationKey` is
 * derived from it, and every other locale is typed as a complete
 * `Record<TranslationKey, string>`. Forgetting a translation is therefore a
 * *compile* error, caught by `astro check` before a single page renders —
 * not a runtime `undefined` that ships to production as a blank button.
 *
 * This module imports nothing, so it is trivially unit-testable.
 *
 * `{placeholder}` tokens are substituted by `useTranslations` in ./utils.ts.
 */

export const en = {
  // Navigation and layout chrome
  "nav.main": "Main navigation",
  "nav.features": "Features",
  "nav.pricing": "Pricing",
  "nav.faq": "FAQ",
  "nav.blog": "Blog",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",

  // Hero
  "hero.eyebrow": "Now in public beta",
  "hero.title": "Ship your next idea before the coffee goes cold",
  "hero.subtitle":
    "Beacon gives small teams the deployment pipeline, preview environments and rollback safety of a much larger one — without the platform team.",
  "hero.ctaPrimary": "Start free",
  "hero.ctaSecondary": "Read the blog",

  // Features
  "features.title": "Everything you need, nothing you don't",
  "features.subtitle":
    "A deliberately small surface area. Each piece does one job well and gets out of the way.",

  // Pricing
  "pricing.title": "Simple, honest pricing",
  "pricing.subtitle": "Start free. Upgrade when your team outgrows it.",
  "pricing.monthly": "Monthly",
  "pricing.annual": "Annual",
  "pricing.perMonth": "/mo",
  "pricing.billedAnnually": "billed annually",
  "pricing.free": "Free",
  "pricing.cta": "Choose {plan}",
  "pricing.featured": "Most popular",
  "pricing.billingToggle": "Billing period",

  // Testimonials
  "testimonials.title": "Teams that made the switch",
  "testimonials.subtitle": "A few words from people who ship on Beacon daily.",

  // FAQ
  "faq.title": "Frequently asked questions",
  "faq.subtitle": "Still stuck? Get in touch and a human will answer.",

  // Closing call to action
  "cta.title": "Ready to ship faster?",
  "cta.subtitle": "Set up your first deployment in under five minutes.",
  "cta.button": "Get started free",

  // Footer
  "footer.rights": "© {year} Beacon. All rights reserved.",
  "footer.builtWith": "Built with Astro",

  // Blog
  "blog.title": "Blog",
  "blog.subtitle": "Product news, engineering notes and the occasional rant.",
  "blog.readingTime": "{minutes} min read",
  "blog.published": "Published {date}",
  "blog.updated": "Updated {date}",
  "blog.backToBlog": "Back to blog",
  "blog.readMore": "Read more",
  "blog.empty": "No posts yet. Check back soon.",
  "blog.untranslated":
    "This post isn't available in your language yet — showing the English version.",

  // Pagination
  "pagination.label": "Blog pagination",
  "pagination.previous": "Previous",
  "pagination.next": "Next",
  "pagination.status": "Page {current} of {total}",

  // Theme
  "theme.toggle": "Change theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",

  // Language
  "lang.switch": "Change language",
  "lang.en": "English",
  "lang.id": "Bahasa Indonesia",

  // Accessibility helpers
  "a11y.skipToContent": "Skip to content",
  "a11y.externalLink": "(opens in a new tab)",

  // Not found
  "notFound.title": "Page not found",
  "notFound.description":
    "This page doesn't exist. It may have moved, or the link is wrong.",
  "notFound.home": "Go to the homepage",
} as const

export type TranslationKey = keyof typeof en

/**
 * Typed as `Record<TranslationKey, string>` on purpose: omit a key, or
 * misspell one, and this file fails to compile.
 */
export const id: Record<TranslationKey, string> = {
  "nav.main": "Navigasi utama",
  "nav.features": "Fitur",
  "nav.pricing": "Harga",
  "nav.faq": "Pertanyaan Umum",
  "nav.blog": "Blog",
  "nav.openMenu": "Buka menu",
  "nav.closeMenu": "Tutup menu",

  "hero.eyebrow": "Kini dalam beta publik",
  "hero.title": "Luncurkan ide berikutnya sebelum kopi Anda dingin",
  "hero.subtitle":
    "Beacon memberi tim kecil alur deployment, lingkungan pratinjau, dan keamanan rollback selayaknya tim besar — tanpa perlu tim platform.",
  "hero.ctaPrimary": "Mulai gratis",
  "hero.ctaSecondary": "Baca blog",

  "features.title": "Semua yang Anda butuhkan, tanpa yang tidak",
  "features.subtitle":
    "Cakupan yang sengaja dibuat ringkas. Setiap bagian melakukan satu tugas dengan baik, lalu menyingkir.",

  "pricing.title": "Harga sederhana dan jujur",
  "pricing.subtitle":
    "Mulai gratis. Tingkatkan saat tim Anda membutuhkan lebih.",
  "pricing.monthly": "Bulanan",
  "pricing.annual": "Tahunan",
  "pricing.perMonth": "/bln",
  "pricing.billedAnnually": "ditagih tahunan",
  "pricing.free": "Gratis",
  "pricing.cta": "Pilih {plan}",
  "pricing.featured": "Paling populer",
  "pricing.billingToggle": "Periode penagihan",

  "testimonials.title": "Tim yang telah beralih",
  "testimonials.subtitle":
    "Sedikit cerita dari mereka yang merilis lewat Beacon setiap hari.",

  "faq.title": "Pertanyaan yang sering diajukan",
  "faq.subtitle": "Masih bingung? Hubungi kami dan tim kami akan menjawab.",

  "cta.title": "Siap merilis lebih cepat?",
  "cta.subtitle":
    "Siapkan deployment pertama Anda dalam kurang dari lima menit.",
  "cta.button": "Mulai gratis sekarang",

  "footer.rights": "© {year} Beacon. Seluruh hak cipta dilindungi.",
  "footer.builtWith": "Dibuat dengan Astro",

  "blog.title": "Blog",
  "blog.subtitle":
    "Kabar produk, catatan teknis, dan sesekali keluh kesah rekayasa.",
  "blog.readingTime": "{minutes} menit baca",
  "blog.published": "Terbit {date}",
  "blog.updated": "Diperbarui {date}",
  "blog.backToBlog": "Kembali ke blog",
  "blog.readMore": "Selengkapnya",
  "blog.empty": "Belum ada tulisan. Nantikan segera.",
  "blog.untranslated":
    "Artikel ini belum tersedia dalam bahasa Anda — menampilkan versi Inggris.",

  "pagination.label": "Navigasi halaman blog",
  "pagination.previous": "Sebelumnya",
  "pagination.next": "Berikutnya",
  "pagination.status": "Halaman {current} dari {total}",

  "theme.toggle": "Ubah tema",
  "theme.light": "Terang",
  "theme.dark": "Gelap",
  "theme.system": "Sistem",

  "lang.switch": "Ubah bahasa",
  "lang.en": "English",
  "lang.id": "Bahasa Indonesia",

  "a11y.skipToContent": "Lewati ke konten",
  "a11y.externalLink": "(terbuka di tab baru)",

  "notFound.title": "Halaman tidak ditemukan",
  "notFound.description":
    "Halaman ini tidak ada. Mungkin sudah dipindahkan, atau tautannya keliru.",
  "notFound.home": "Ke halaman utama",
}

export const ui = { en, id } as const
