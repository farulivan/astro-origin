import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import astro from "eslint-plugin-astro"
import jsxA11y from "eslint-plugin-jsx-a11y"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores(["dist", ".astro", "coverage", "stats.html"]),

  {
    files: ["**/*.{js,ts,tsx,astro}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      // TypeScript already reports undefined identifiers, and does it with
      // knowledge of ambient declarations like Astro's `ImageMetadata`, which
      // ESLint's own scope analysis cannot see.
      "no-undef": "off",
    },
  },

  // Parses .astro frontmatter, templates and client-side scripts, and applies
  // the a11y rules to Astro's HTML-like template syntax.
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],

  // Islands are the only React in this project, so the hooks rules apply to
  // exactly one directory rather than the whole tree.
  {
    files: ["src/components/islands/**/*.tsx"],
    extends: [reactHooks.configs.flat.recommended],
    ...jsxA11y.flatConfigs.recommended,
  },

  // Node context: config files, the build-time Sätteri plugins, and the
  // setup script. The script is .js rather than .mjs so that this glob and
  // the main TS/JS block both see it.
  {
    files: ["*.config.{js,mjs,ts}", "src/mdast/**/*.ts", "scripts/**/*.js"],
    languageOptions: { globals: globals.node },
  },
])
