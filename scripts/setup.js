#!/usr/bin/env node
/**
 * Rewrites the template's placeholder identity as your own.
 *
 * The name, the origin and the repository appear in six files. Leaving people
 * to grep for them is how a template ships to production still calling itself
 * Origin and pointing its sitemap at example.com.
 *
 * Node rather than a shell script on purpose: `sed -i` takes an argument on
 * BSD that it rejects on GNU, and neither exists on Windows. Node 22 has
 * everything this needs in the standard library, so there is nothing to
 * install before you can install.
 */
import { readFile, writeFile } from "node:fs/promises"
import { createInterface } from "node:readline/promises"
import { execFileSync } from "node:child_process"
import { stdin, stdout, argv, exit } from "node:process"

const DRY_RUN = argv.includes("--dry-run")

/** The identity this template ships with. */
const PLACEHOLDER = {
  name: "Origin",
  url: "https://example.com",
  repo: "farulivan/astro-origin",
  pkg: "astro-origin",
  handle: "astro_origin",
  storageKey: "origin.theme",
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

function die(message) {
  console.error(`\n  ${message}\n`)
  exit(1)
}

/**
 * A dirty tree would make the rewrite indistinguishable from your own edits.
 * Refusing here is what makes `git diff` a complete record of what this did.
 */
function assertCleanTree() {
  if (DRY_RUN) return
  let status
  try {
    status = execFileSync("git", ["status", "--porcelain"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
  } catch {
    return // not a git repository; nothing to protect
  }
  if (status.trim()) {
    die(
      "Working tree is not clean. Commit or stash first, so `git diff` shows\n" +
        "  exactly what this script changed. Or pass --dry-run to preview."
    )
  }
}

/** Replace every occurrence, and fail loudly if there were none. */
function replaceAll(source, from, to, where) {
  if (from === to) return source
  if (!source.includes(from)) {
    die(`Expected to find ${JSON.stringify(from)} in ${where} and did not.`)
  }
  return source.split(from).join(to)
}

async function edit(file, fn) {
  const before = await readFile(file, "utf8")
  const after = fn(before, file)
  if (before === after) return null
  if (!DRY_RUN) await writeFile(file, after)
  return file
}

async function main() {
  assertCleanTree()

  const rl = createInterface({ input: stdin, output: stdout })
  const ask = async (question, fallback) => {
    const answer = (await rl.question(`  ${question} `)).trim()
    return answer || fallback
  }

  console.log("\n  Setting up your project. Press enter to keep a default.\n")

  const name = await ask("Project name:", PLACEHOLDER.name)

  let url = await ask("Site URL (https://…):", PLACEHOLDER.url)
  url = url.replace(/\/+$/, "")
  if (!/^https?:\/\/[^/\s]+$/.test(url)) {
    rl.close()
    die(
      `"${url}" is not an origin. Expected something like https://example.com`
    )
  }

  const repo = await ask("GitHub repository (owner/repo):", PLACEHOLDER.repo)
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    rl.close()
    die(`"${repo}" is not an owner/repo pair.`)
  }

  const handle = (await ask("X handle (without @, optional):", "")).replace(
    /^@/,
    ""
  )
  rl.close()

  const pkg = repo.split("/")[1]
  const storageKey = `${slug(name)}.theme`

  const changed = []
  const touch = (file) => file && changed.push(file)

  touch(
    await edit("astro.config.ts", (s, f) =>
      replaceAll(s, `site: "${PLACEHOLDER.url}"`, `site: "${url}"`, f)
    )
  )

  touch(
    await edit("src/config/site.ts", (s, f) => {
      s = replaceAll(s, `name: "${PLACEHOLDER.name}"`, `name: "${name}"`, f)
      s = replaceAll(s, `url: "${PLACEHOLDER.url}"`, `url: "${url}"`, f)
      s = replaceAll(
        s,
        `themeStorageKey: "${PLACEHOLDER.storageKey}"`,
        `themeStorageKey: "${storageKey}"`,
        f
      )
      s = replaceAll(
        s,
        `twitterHandle: "${PLACEHOLDER.handle}"`,
        `twitterHandle: "${handle}"`,
        f
      )
      // Placeholders point at "/#" on purpose; only fill what we know.
      s = s.replace(/github: "\/#"/, `github: "https://github.com/${repo}"`)
      if (handle) s = s.replace(/x: "\/#"/, `x: "https://x.com/${handle}"`)
      return s
    })
  )

  touch(
    await edit("public/robots.txt", (s, f) =>
      replaceAll(s, PLACEHOLDER.url, url, f)
    )
  )

  touch(
    await edit("public/site.webmanifest", (s, f) => {
      s = replaceAll(s, `"name": "${PLACEHOLDER.name}"`, `"name": "${name}"`, f)
      return replaceAll(
        s,
        `"short_name": "${PLACEHOLDER.name}"`,
        `"short_name": "${name}"`,
        f
      )
    })
  )

  touch(
    await edit("package.json", (s, f) => {
      s = replaceAll(s, `"name": "${PLACEHOLDER.pkg}"`, `"name": "${pkg}"`, f)
      return s.split(PLACEHOLDER.repo).join(repo)
    })
  )

  touch(
    await edit("README.md", (s, f) => {
      s = replaceAll(s, `# ${PLACEHOLDER.pkg}\n`, `# ${name}\n`, f)
      return s.split(PLACEHOLDER.repo).join(repo)
    })
  )

  console.log(
    `\n  ${DRY_RUN ? "Would update" : "Updated"} ${changed.length} file${changed.length === 1 ? "" : "s"}:`
  )
  for (const file of changed) console.log(`    ${file}`)

  if (DRY_RUN) {
    console.log("\n  Dry run — nothing was written.\n")
    return
  }

  console.log(`
  Review it with \`git diff\`, then:

    pnpm dev

  The copy still says Origin in src/i18n/ui.ts and src/content/ — that is
  yours to write, and it is the part no script should guess.
`)
}

await main()
