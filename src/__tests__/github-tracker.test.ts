/**
 * @jest-environment node
 */

import { readdirSync, readFileSync } from "fs";
import path from "path";

import type { Label } from "../../scripts/github/sync-labels";
import { planLabelSync } from "../../scripts/github/sync-labels";

/**
 * The issue tracker is defined in `.github/` (ADR-0042): the labels a fork
 * syncs, the issue forms that apply them, and the diff `npm run labels:sync`
 * runs. GitHub rejects a form that names an unknown label only when someone
 * opens it, and a label it cannot store only when the sync writes it, so both
 * are checked here.
 */

const read = (...segments: string[]) => readFileSync(path.join(process.cwd(), ...segments), "utf8");

const labels = JSON.parse(read(".github", "labels.json")) as Label[];
const names = labels.map((label) => label.name);

const TEMPLATE_DIR = path.join(".github", "ISSUE_TEMPLATE");
const forms = readdirSync(path.join(process.cwd(), TEMPLATE_DIR))
  .filter((file) => file.endsWith(".yml") && file !== "config.yml")
  .map((file) => ({ file, text: read(TEMPLATE_DIR, file) }));

/** A form's labels, written in flow style on one line: `labels: ["type:task"]`. */
const formLabels = (text: string) => {
  const match = /^labels:\s*\[(.*)\]\s*$/m.exec(text);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((entry) => entry.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
};

describe(".github/labels.json", () => {
  it("names each label once", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every label six hex digits and a description GitHub can store", () => {
    for (const label of labels) {
      expect(label.color).toMatch(/^[0-9a-f]{6}$/);
      expect(label.description.length).toBeGreaterThan(0);
      expect(label.description.length).toBeLessThanOrEqual(100);
    }
  });

  it("holds every type, tier, severity and state the register ranks by", () => {
    expect(names).toEqual(
      expect.arrayContaining([
        "type:task",
        "type:bug",
        "type:decision",
        "tier:1",
        "tier:2",
        "tier:3",
        "tier:4",
        "tier:5",
        "sev:P1",
        "sev:P2",
        "sev:P3",
        "state:ready",
        "state:owner",
        "state:backend",
        "state:upstream",
        "state:deferred",
      ]),
    );
  });

  it("keeps the two labels Dependabot applies, so the sync does not delete them", () => {
    expect(names).toEqual(expect.arrayContaining(["dependencies", "github_actions"]));
  });
});

describe(".github/ISSUE_TEMPLATE", () => {
  it("has a form for a task, a bug and a decision", () => {
    expect(forms.map((form) => form.file).sort()).toEqual(["bug.yml", "decision.yml", "task.yml"]);
  });

  it.each(forms.map((form) => [form.file, form.text]))(
    "gives %s a name, a description and a body",
    (_file, text) => {
      expect(text).toMatch(/^name: \S/m);
      expect(text).toMatch(/^description: \S/m);
      expect(text).toMatch(/^body:$/m);
    },
  );

  it.each(forms.map((form) => [form.file, form.text]))(
    "lets %s apply only labels that labels.json defines",
    (_file, text) => {
      const applied = formLabels(text);
      expect(applied.length).toBeGreaterThan(0);
      for (const name of applied) expect(names).toContain(name);
    },
  );

  it("turns blank issues off", () => {
    expect(read(TEMPLATE_DIR, "config.yml")).toMatch(/^blank_issues_enabled: false$/m);
  });
});

describe("planLabelSync", () => {
  const task: Label = { name: "type:task", color: "0e8a16", description: "A piece of work" };
  const bug: Label = { name: "type:bug", color: "d73a4a", description: "Something is wrong" };

  it("creates the labels the repository lacks", () => {
    expect(planLabelSync([task, bug], [task])).toEqual({ create: [bug], update: [], remove: [] });
  });

  it("updates a label whose colour or description differs", () => {
    const stale = { ...task, color: "ffffff" };
    const reworded = { ...bug, description: "Old words" };

    expect(planLabelSync([task, bug], [stale, reworded])).toEqual({
      create: [],
      update: [task, bug],
      remove: [],
    });
  });

  it("matches colours case-insensitively, as GitHub stores them", () => {
    expect(planLabelSync([task], [{ ...task, color: "0E8A16" }])).toEqual({
      create: [],
      update: [],
      remove: [],
    });
  });

  it("removes the labels labels.json does not list", () => {
    const wontfix: Label = { name: "wontfix", color: "ffffff", description: "Not worked on" };

    expect(planLabelSync([task], [task, wontfix])).toEqual({
      create: [],
      update: [],
      remove: ["wontfix"],
    });
  });

  it("does nothing when the repository already matches", () => {
    expect(planLabelSync([task, bug], [bug, task])).toEqual({ create: [], update: [], remove: [] });
  });
});
