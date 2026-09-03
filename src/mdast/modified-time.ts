import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { defineMdastPlugin } from "satteri"

import { frontmatterOf } from "./astro-data"

/**
 * Adds a git-derived `lastModified` timestamp to a post's frontmatter.
 *
 * Deliberately a *fallback*, never the source of truth: hosts that shallow-
 * clone the repository resolve `git log` to a valid but wrong commit, and
 * Vercel clones at depth 2 without offering a way to change it. Frontmatter
 * `updatedDate` wins wherever it is present — see `resolvePostDate` in
 * src/lib/format.ts, which is the only place that precedence is decided.
 *
 * A missing or failing git command is not an error: a shallow clone, a fresh
 * file that has never been committed, or a tarball export should all still
 * build.
 */
export const modifiedTimePlugin = defineMdastPlugin({
  name: "modified-time",
  before(_root, ctx) {
    const frontmatter = frontmatterOf(ctx.data)
    if (!frontmatter || !ctx.fileURL) return

    try {
      const filepath = fileURLToPath(ctx.fileURL)
      const stdout = execSync(
        `git log -1 --pretty="format:%cI" -- "${filepath}"`,
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }
      ).trim()

      if (stdout) frontmatter.lastModified = stdout
    } catch {
      // No git history available — the frontmatter date is used instead.
    }
  },
})
