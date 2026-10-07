/**
 * @jest-environment node
 */

import { readFileSync } from "fs";
import path from "path";

/**
 * `docs/reference/commands.md` is the one list of this repo's npm scripts, and
 * it says it is checked against `package.json`. This is that check. Until
 * 2026-10-07 the sentence was there and the check was not.
 *
 * It compares names only. Whether a description is still true is for review.
 */

const read = (...segments: string[]) => readFileSync(path.join(process.cwd(), ...segments), "utf8");

const scripts = Object.keys(
  (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts,
);

const doc = read("docs", "reference", "commands.md");

/**
 * A script is documented when it has a table row: its name is set in code in
 * the row's first cell, as `npm run lint` or as the bare `lint:fix` beside it.
 * A mention in prose does not count, or deleting a row would go unnoticed
 * wherever the name is also used in a sentence.
 */
const documented = new Set(
  doc
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .flatMap((line) => [...(line.split("|")[1] ?? "").matchAll(/`([^`]+)`/g)])
    .map(([, span]) => span.replace(/^npm run /, "").split(/\s/)[0]),
);

/** Script names the doc tells a reader to run. */
const invoked = [...doc.matchAll(/npm run ([\w:.-]+)/g)].map(([, name]) => name);

describe("docs/reference/commands.md", () => {
  it("reads a script list and a doc that are both non-empty", () => {
    // Otherwise the two checks below pass against nothing.
    expect(scripts.length).toBeGreaterThan(10);
    expect(invoked.length).toBeGreaterThan(10);
  });

  it("documents every script in package.json", () => {
    expect(scripts.filter((name) => !documented.has(name))).toEqual([]);
  });

  it("names no script that package.json does not have", () => {
    expect([...new Set(invoked)].filter((name) => !scripts.includes(name))).toEqual([]);
  });
});
