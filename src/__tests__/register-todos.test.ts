/**
 * @jest-environment node
 */

import { readdirSync, readFileSync } from "fs";
import path from "path";

/**
 * `.claude/rules/workflow.md` § What's next says a new todo gets a row in the
 * debt register in the same PR, or the "what's next" answer never sees it.
 * This is that check. Until 2026-10-19 the rule was there and the check was not
 * (register row F-43).
 *
 * A todo is open when a line begins, after any indent, with `- [ ]`
 * (the register's decision D-04). Every open todo must be named in a row of
 * `register.md`, which holds open rows only; closed rows live in
 * `register-closed.md` since 2026-10-23 (D-05). A todo with every box ticked,
 * or with no boxes, is finished and needs no row.
 *
 * It cannot see a finding written as prose instead of a box, or a row left open
 * after its todo was fully ticked. Those are for review.
 */

const TODOS = path.join(process.cwd(), "docs", "internal", "todos");
const REGISTER_DIR = path.join(
  process.cwd(),
  "docs",
  "internal",
  "initiatives",
  "frontend-debt-register",
);

/** Table lines only: a mention in a paragraph is not a row. */
const tableRows = (file: string) =>
  readFileSync(path.join(REGISTER_DIR, file), "utf8")
    .split("\n")
    .filter((line) => line.startsWith("|"));

const rowIds = (rows: string[]) =>
  rows.map((line) => /^\| ([FO]-\d+) \|/.exec(line)?.[1]).filter((id) => id !== undefined);

const openRows = tableRows("register.md");
const closedRows = tableRows("register-closed.md");

const todos = readdirSync(TODOS).filter((name) => name.endsWith(".md"));

const openTodos = todos.filter((name) =>
  /^\s*- \[ \]/m.test(readFileSync(path.join(TODOS, name), "utf8")),
);

describe("the debt register against docs/internal/todos", () => {
  it("reads a todo folder with open todos and a register with open and closed rows", () => {
    // Otherwise the checks below pass against nothing.
    expect(todos.length).toBeGreaterThan(10);
    expect(openTodos.length).toBeGreaterThan(0);
    expect(rowIds(openRows).length).toBeGreaterThan(0);
    expect(rowIds(closedRows).length).toBeGreaterThan(0);
  });

  it("names every open todo in a row of register.md", () => {
    // A todo listed here needs a register row, placed by the ranking rule D-01.
    const open = openRows.join("\n");
    expect(openTodos.filter((name) => !open.includes(name))).toEqual([]);
  });

  it("keeps no row in both register.md and register-closed.md", () => {
    // A closing PR moves the row; one that copies it leaves the row open too.
    const closed = new Set(rowIds(closedRows));
    expect(rowIds(openRows).filter((id) => closed.has(id))).toEqual([]);
  });
});
