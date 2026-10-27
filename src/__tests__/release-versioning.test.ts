/**
 * @jest-environment node
 */

import { readFileSync } from "fs";
import path from "path";

import { changelogSection, extractSection, nextVersion } from "../../scripts/github/release";

/**
 * Releases are versioned on `dev` and tagged on `main` (ADR-0045, #174).
 * `npm run release:prepare` bumps the version and writes the changelog section
 * in an ordinary pull request; `release.yml` tags the promotion that carries it.
 * The workflow runs only on a push to `main`, so a mistake in it would surface
 * after a promotion merged. Its shape is checked here instead.
 */

const read = (...segments: string[]) => readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("nextVersion", () => {
  it.each([
    ["patch", "0.2.1"],
    ["minor", "0.3.0"],
    ["major", "1.0.0"],
    ["0.4.0", "0.4.0"],
  ])("%s from 0.2.0 is %s", (bump, expected) => {
    expect(nextVersion("0.2.0", bump)).toBe(expected);
  });

  it("refuses a version that is not greater than the current one", () => {
    expect(() => nextVersion("0.2.0", "0.2.0")).toThrow(/greater/);
    expect(() => nextVersion("0.2.0", "0.1.9")).toThrow(/greater/);
  });

  it("refuses anything that is not a bump or x.y.z", () => {
    expect(() => nextVersion("0.2.0", "v0.3.0")).toThrow(/bump/);
    expect(() => nextVersion("0.2.0", "0.3")).toThrow(/bump/);
    expect(() => nextVersion("0.2", "minor")).toThrow(/version/);
  });
});

describe("changelogSection", () => {
  const section = changelogSection("0.2.0", "2026-10-27", [
    "fix(organizations): follow nextCursor on the members and org lists",
    "chore(release): 0.2.0",
    "feat(ui): add a release badge",
    "Merge pull request #182 from dimaszisby/docs/181-fix-stale-docs",
    "docs: fix stale and contradictory references",
    "feat(api)!: drop the v1 proxy path",
    "update readme",
  ]);

  it("groups subjects by type, breaking changes first, and leaves out empty groups", () => {
    expect(section).toBe(
      [
        "## 0.2.0 - 2026-10-27",
        "",
        "### Breaking changes",
        "",
        "- feat(api)!: drop the v1 proxy path",
        "",
        "### Features",
        "",
        "- feat(ui): add a release badge",
        "",
        "### Fixes",
        "",
        "- fix(organizations): follow nextCursor on the members and org lists",
        "",
        "### Other",
        "",
        "- docs: fix stale and contradictory references",
        "- update readme",
        "",
      ].join("\n"),
    );
  });

  it("refuses a release with nothing in it", () => {
    expect(() => changelogSection("0.2.0", "2026-10-27", ["chore(release): 0.2.0"])).toThrow(
      /nothing/,
    );
  });
});

describe("extractSection", () => {
  const changelog = [
    "# Changelog",
    "",
    "## 0.3.0 - 2026-11-01",
    "",
    "### Fixes",
    "",
    "- fix: one",
    "",
    "## 0.2.0 - 2026-10-27",
    "",
    "- two",
    "",
  ].join("\n");

  it("returns the body under the version's heading, up to the next one", () => {
    expect(extractSection(changelog, "0.3.0")).toBe("### Fixes\n\n- fix: one");
    expect(extractSection(changelog, "0.2.0")).toBe("- two");
  });

  it("does not match a version that only starts the same", () => {
    expect(() => extractSection(changelog, "0.3")).toThrow(/no section/);
  });

  it("throws when the version has no section", () => {
    expect(() => extractSection(changelog, "0.4.0")).toThrow(/no section/);
  });
});

describe("the repository's release records", () => {
  it("CHANGELOG.md has a section for package.json's version", () => {
    const { version } = JSON.parse(read("package.json")) as { version: string };
    expect(extractSection(read("CHANGELOG.md"), version)).not.toBe("");
  });

  it("package-lock.json carries the same version as package.json", () => {
    const { version } = JSON.parse(read("package.json")) as { version: string };
    const lock = JSON.parse(read("package-lock.json")) as {
      version: string;
      packages: Record<string, { version?: string }>;
    };
    expect(lock.version).toBe(version);
    expect(lock.packages[""]?.version).toBe(version);
  });
});

describe("release.yml", () => {
  const workflow = read(".github", "workflows", "release.yml");

  it("runs only on a push to main", () => {
    expect(workflow).toMatch(/^on:\n {2}push:\n {4}branches:\n {6}- main\n(?! )/m);
  });

  it("reads by default, and writes only in the release job", () => {
    expect(workflow).toMatch(/^permissions:\n {2}contents: read$/m);
    expect(workflow.match(/contents: write/g)).toHaveLength(1);
    expect(workflow).toMatch(/^ {4}permissions:\n {6}contents: write$/m);
  });

  it("runs no third-party action, each one pinned by commit SHA", () => {
    const uses = [...workflow.matchAll(/uses: (\S+)/g)].map(([, ref]) => ref);
    expect(uses.length).toBeGreaterThan(0);
    for (const ref of uses) expect(ref).toMatch(/^actions\/[\w-]+@[0-9a-f]{40}$/);
  });

  it("reads no secret", () => {
    expect(workflow).not.toMatch(/secrets\.(?!GITHUB_TOKEN\b)/);
  });
});
