#!/usr/bin/env node
/**
 * Rewrites the template's placeholder identity as your own.
 *
 * The name, the origin and the repository appear in five files. Leaving people
 * to grep for them is how a template ships to production still calling itself
 * Origin and pointing its sitemap at someone else's domain.
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
  url: "https://astro-origin.farulivan.com",
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

/** Replace every occurrence, and complain if there were none. */
function replaceAll(source, from, to, where) {
  if (from === to) return source
  if (!source.includes(from)) {
    throw new Error(`expected to find ${JSON.stringify(from)} in ${where}`)
  }
  return source.split(from).join(to)
}

/**
 * Every file is read and transformed before any of them is written.
 *
 * Writing as it went meant one missing anchor could leave a project half
 * converted — three files rewritten, two not — which is worse than not running
 * at all. `create-astro` renames package.json for you, which is exactly how
 * that failure was found.
 */
const staged = []
const problems = []

async function stage(file, transform) {
  const before = await readFile(file, "utf8")
  try {
    const after = transform(before, file)
    if (before !== after) staged.push({ file, after })
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error))
  }
}

async function commit() {
  if (problems.length > 0) {
    die(
      `Nothing was written. ${problems.length} check${problems.length === 1 ? "" : "s"} failed:\n` +
        problems.map((p) => `    - ${p}`).join("\n")
    )
  }
  if (DRY_RUN) return
  for (const { file, after } of staged) await writeFile(file, after)
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

  await stage("astro.config.ts", (s, f) =>
    replaceAll(s, `site: "${PLACEHOLDER.url}"`, `site: "${url}"`, f)
  )

  await stage("src/config/site.ts", (s, f) => {
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
    // Social placeholders point at "/#" on purpose; only fill what we know.
    s = s.replace(/github: "\/#"/, `github: "https://github.com/${repo}"`)
    if (handle) s = s.replace(/x: "\/#"/, `x: "https://x.com/${handle}"`)
    return s
  })

  await stage("public/site.webmanifest", (s, f) => {
    s = replaceAll(s, `"name": "${PLACEHOLDER.name}"`, `"name": "${name}"`, f)
    return replaceAll(
      s,
      `"short_name": "${PLACEHOLDER.name}"`,
      `"short_name": "${name}"`,
      f
    )
  })

  await stage("package.json", (s) => {
    // Not anchored on the shipped name: `create-astro` sets it to whatever
    // directory you scaffolded into, so by the time this runs it is already
    // something else.
    s = s.replace(/"name": "[^"]*"/, `"name": "${pkg}"`)
    s = s.split(PLACEHOLDER.repo).join(repo)
    return s.split(PLACEHOLDER.url).join(url)
  })

  await stage("README.md", (s) => {
    s = s.replace(/^# .*$/m, `# ${name}`)
    s = s.split(PLACEHOLDER.repo).join(repo)
    // Including the demo link, so a fork does not advertise this one.
    return s.split(PLACEHOLDER.url).join(url)
  })

  await commit()

  const count = staged.length
  console.log(
    `\n  ${DRY_RUN ? "Would update" : "Updated"} ${count} file${count === 1 ? "" : "s"}:`
  )
  for (const { file } of staged) console.log(`    ${file}`)

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
