// Adds the jest-dom matchers (toBeInTheDocument, toHaveAttribute, …) to
// Vitest's expect. Safe everywhere: it only extends the matcher table.
import "@testing-library/jest-dom/vitest"

/**
 * Unmount React trees between tests.
 *
 * Testing Library auto-registers this only when the test framework's globals
 * are enabled; this project imports `describe`/`it`/`expect` explicitly, so
 * it has to be wired by hand — otherwise every render stacks up in the same
 * document and queries start reporting "found multiple elements".
 *
 * Guarded on `document` because this setup file also runs for the
 * node-environment tests, where importing a DOM library would throw.
 */
if (typeof document !== "undefined") {
  const [{ cleanup }, { afterEach }] = await Promise.all([
    import("@testing-library/react"),
    import("vitest"),
  ])
  afterEach(cleanup)
}
