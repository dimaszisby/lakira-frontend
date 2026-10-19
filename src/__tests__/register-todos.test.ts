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
 * (the register's decision D-04). Every open todo must be named in a row above
 * the register's `## Closed` heading. A todo with every box ticked, or with no
 * boxes, is finished and needs no row.
 *
 * It cannot see a finding written as prose instead of a box, or a row left open
 * after its todo was fully ticked. Those are for review.
 */

const TODOS = path.join(process.cwd(), "docs", "internal", "todos");
const REGISTER = path.join(
  process.cwd(),
  "docs",
  "internal",
  "initiatives",
  "frontend-debt-register",
  "register.md",
);

const register = readFileSync(REGISTER, "utf8");
const closedAt = register.search(/^## Closed$/m);
/** Table lines only: a mention in a paragraph is not a row. */
const openRows = (closedAt === -1 ? "" : register.slice(0, closedAt))
  .split("\n")
  .filter((line) => line.startsWith("|"))
  .join("\n");

const todos = readdirSync(TODOS).filter((name) => name.endsWith(".md"));

const openTodos = todos.filter((name) =>
  /^\s*- \[ \]/m.test(readFileSync(path.join(TODOS, name), "utf8")),
);

describe("the debt register against docs/internal/todos", () => {
  it("reads a todo folder with open todos and a register with a Closed section", () => {
    // Otherwise the check below passes against nothing.
    expect(closedAt).toBeGreaterThan(0);
    expect(todos.length).toBeGreaterThan(10);
    expect(openTodos.length).toBeGreaterThan(0);
  });

  it("names every open todo in a row above Closed", () => {
    // A todo listed here needs a register row, placed by the ranking rule D-01.
    expect(openTodos.filter((name) => !openRows.includes(name))).toEqual([]);
  });
});
