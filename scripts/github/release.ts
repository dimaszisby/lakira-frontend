/**
 * release.ts — version a release on dev, and give release.yml its notes on main.
 *
 * Usage:
 *   npm run release:prepare -- minor      # or major, patch, or an explicit x.y.z
 *   npm run release:notes -- 0.2.0        # print that version's CHANGELOG.md section
 *
 * `prepare` bumps package.json and package-lock.json and adds a CHANGELOG.md
 * section listing the commits `dev` holds and `main` does not: what the next
 * promotion adds. Run `git fetch origin` first, since it reads the local
 * `origin/main`. It commits nothing; the result goes to dev in an ordinary pull
 * request, and release.yml tags the promotion that carries it (ADR-0045).
 *
 * Node runs this file directly by stripping its types, as it does sync-labels.ts
 * (kit `tracker-as-code`, D-02), so it uses only syntax that can be stripped.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

const parse = (version: string) => {
  const match = VERSION.exec(version);
  if (!match) throw new Error(`"${version}" is not a version of the form x.y.z`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const isGreater = (a: number[], b: number[]) => {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

/** The version after `current`: a `major`, `minor` or `patch` bump, or an explicit greater x.y.z. */
export const nextVersion = (current: string, bump: string) => {
  const [major, minor, patch] = parse(current);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
  if (!VERSION.test(bump)) {
    throw new Error(`"${bump}" is not a bump: use major, minor, patch or x.y.z`);
  }
  if (!isGreater(parse(bump), [major, minor, patch])) {
    throw new Error(`${bump} is not greater than the current ${current}`);
  }
  return bump;
};

const GROUPS = [
  { title: "Breaking changes", matches: (subject: string) => /^\w+(\([^)]*\))?!:/.test(subject) },
  { title: "Features", matches: (subject: string) => /^feat(\([^)]*\))?:/.test(subject) },
  { title: "Fixes", matches: (subject: string) => /^fix(\([^)]*\))?:/.test(subject) },
  { title: "Other", matches: () => true },
];

const isSkipped = (subject: string) =>
  /^chore\(release\)/.test(subject) || /^Merge (pull request|branch) /.test(subject);

/**
 * The CHANGELOG.md section for a release: commit subjects as written, grouped by
 * their Conventional Commit type. A subject that is not conventional goes under Other.
 */
export const changelogSection = (version: string, date: string, subjects: string[]) => {
  const remaining = subjects.filter((subject) => !isSkipped(subject));
  if (remaining.length === 0) throw new Error(`${version} has nothing to release`);

  const lines = [`## ${version} - ${date}`, ""];
  let unplaced = remaining;
  for (const group of GROUPS) {
    const entries = unplaced.filter(group.matches);
    unplaced = unplaced.filter((subject) => !group.matches(subject));
    if (entries.length === 0) continue;
    lines.push(`### ${group.title}`, "", ...entries.map((subject) => `- ${subject}`), "");
  }
  return lines.join("\n");
};

const isHeadingOf = (version: string) => (line: string) =>
  line === `## ${version}` || line.startsWith(`## ${version} `);

/** The body of `version`'s section in a changelog, without its heading. */
export const extractSection = (changelog: string, version: string) => {
  const lines = changelog.split("\n");
  const start = lines.findIndex(isHeadingOf(version));
  if (start === -1) throw new Error(`CHANGELOG.md has no section for ${version}`);
  const next = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines
    .slice(start + 1, next === -1 ? undefined : next)
    .join("\n")
    .trim();
};

const CHANGELOG = path.join(process.cwd(), "CHANGELOG.md");

const run = (command: string, args: string[]) =>
  execFileSync(command, args, { encoding: "utf8" }).trim();

const prepare = (bump: string | undefined) => {
  if (!bump) throw new Error("prepare needs a bump: major, minor, patch or x.y.z");
  const { version: current } = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
  ) as { version: string };
  const version = nextVersion(current, bump);

  const changelog = readFileSync(CHANGELOG, "utf8");
  if (changelog.split("\n").some(isHeadingOf(version))) {
    throw new Error(`CHANGELOG.md already has a section for ${version}`);
  }

  const subjects = run("git", ["log", "--no-merges", "--format=%s", "origin/main..HEAD"])
    .split("\n")
    .filter(Boolean);
  // The local date, as the repository's other records are dated; en-CA formats it YYYY-MM-DD.
  const section = changelogSection(version, new Date().toLocaleDateString("en-CA"), subjects);

  // Insert above the newest release, below the file's own header.
  const firstRelease = changelog.search(/^## /m);
  writeFileSync(
    CHANGELOG,
    firstRelease === -1
      ? `${changelog.trimEnd()}\n\n${section}`
      : `${changelog.slice(0, firstRelease)}${section}\n${changelog.slice(firstRelease)}`,
  );
  run("npm", ["version", version, "--no-git-tag-version", "--ignore-scripts"]);

  process.stdout.write(
    `${current} -> ${version}: package.json, package-lock.json and CHANGELOG.md updated. Review, then commit as "chore(release): ${version}".\n`,
  );
};

const notes = (version: string | undefined) => {
  if (!version) throw new Error("notes needs a version");
  process.stdout.write(`${extractSection(readFileSync(CHANGELOG, "utf8"), version)}\n`);
};

// Run only as the entry point, so the unit test can import the functions above.
if (process.argv[1]?.endsWith(path.join("github", "release.ts"))) {
  const [command, argument] = process.argv.slice(2);
  if (command === "prepare") prepare(argument);
  else if (command === "notes") notes(argument);
  else throw new Error("usage: release.ts prepare <bump> | release.ts notes <version>");
}
