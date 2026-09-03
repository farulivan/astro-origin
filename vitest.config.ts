/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config"

// getViteConfig hands Vitest the project's real Vite config, so tests resolve
// the "@/" alias and Astro's virtual modules exactly the way the app does.
export default getViteConfig({
  test: {
    // Most tests are pure functions or Container-API renders to string, which
    // need no DOM. The one island test opts into happy-dom with a docblock:
    //   // @vitest-environment happy-dom
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: { provider: "v8", include: ["src/**/*.{ts,tsx,astro}"] },
  },
})
