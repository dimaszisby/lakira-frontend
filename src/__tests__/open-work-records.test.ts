/**
 * @jest-environment node
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

/**
 * Open work lives in GitHub Issues since 2026-10-25 (ADR-0044). The debt
 * register and the todo folder stay as records, and this checks they stay
 * honest records: every row the register still lists says where it went, and
 * every todo with an open box names the issue that carries it now. It replaces
 * `register-todos.test.ts`, which held todos to register rows (row F-43).
 *
 * Intake is an issue now, so a todo dated after the freeze is refused.
 *
 * It cannot see whether an issue it names exists or is still open; that is
 * GitHub's, and `gh issue view` is the check.
 */

const FROZEN = "2026-10-25";

const INTERNAL = path.join(process.cwd(), "docs", "internal");
const TODOS = path.join(INTERNAL, "todos");
const REGISTER_DIR = path.join(INTERNAL, "initiatives", "frontend-debt-register");

/**
 * Both records are upstream working material under `docs/internal/`, which
 * `scripts/bootstrap-fork.sh` removes from a fork (step 4). A fork has nothing
 * for these checks to hold, and reading at load time failed its unit gate
 * (#219). The skip keys on the folder, not on the files: upstream, a moved or
 * deleted register still fails below.
 */
const HAS_INTERNAL = existsSync(INTERNAL);

const idOf = (line: string) => /^\| ([FO]-\d+) \|/.exec(line)?.[1];

const tableIds = (text: string) =>
  text
    .split("\n")
    .map(idOf)
    .filter((id) => id !== undefined);

const loadRecords = () => {
  const read = (file: string) => readFileSync(path.join(REGISTER_DIR, file), "utf8");

  const register = read("register.md");

  /** The mapping section runs from its heading to the next `## ` heading. */
  const mapStart = register.search(/^## Where each row went$/m);
  const mapEnd = mapStart < 0 ? -1 : register.indexOf("\n## ", mapStart + 1);
  const mapSection = mapStart < 0 ? "" : register.slice(mapStart, mapEnd < 0 ? undefined : mapEnd);
  const beforeMap = mapStart < 0 ? register : register.slice(0, mapStart);
  const afterMap = mapEnd < 0 ? "" : register.slice(mapEnd);

  const mapping = new Map(
    mapSection
      .split("\n")
      .map((line) => /^\| ([FO]-\d+) \| ([^|]+?) +\|/.exec(line))
      .filter((match) => match !== null)
      .map((match) => [match[1], match[2]] as const),
  );

  const todos = readdirSync(TODOS).filter((name) => name.endsWith(".md"));
  const openTodos = todos.filter((name) =>
    /^\s*- \[ \]/m.test(readFileSync(path.join(TODOS, name), "utf8")),
  );

  return {
    register,
    rowIds: tableIds(`${beforeMap}\n${afterMap}`),
    closedIds: new Set(tableIds(read("register-closed.md"))),
    mapping,
    todos,
    openTodos,
  };
};

(HAS_INTERNAL ? describe : describe.skip)("the frozen debt register and todo folder", () => {
  // In `beforeAll`, which a skipped block never runs; its body would.
  let records: ReturnType<typeof loadRecords>;
  beforeAll(() => {
    records = loadRecords();
  });

  it("reads a frozen register with rows and a mapping, and a todo folder with open todos", () => {
    // Otherwise the checks below pass against nothing.
    expect(records.register).toContain(`**Frozen:** ${FROZEN}`);
    expect(records.rowIds.length).toBeGreaterThan(0);
    expect(records.mapping.size).toBeGreaterThan(0);
    expect(records.openTodos.length).toBeGreaterThan(0);
  });

  it("says where every row of register.md went", () => {
    expect(records.rowIds.filter((id) => !records.mapping.has(id))).toEqual([]);
  });

  it("maps each row to an issue, known-gaps.md or the pull request that closed it", () => {
    const target = /^(#\d+|`known-gaps\.md`|closed in #\d+)$/;
    expect([...records.mapping].filter(([, to]) => !target.test(to))).toEqual([]);
  });

  it("keeps no row in both register.md and register-closed.md", () => {
    expect(records.rowIds.filter((id) => records.closedIds.has(id))).toEqual([]);
  });

  it("names the issue that carries each open todo", () => {
    // One line, `**Issues:** #160, #161`, at the top of the todo's Status section.
    const named = /^\*\*Issues?:\*\* (#\d+|`known-gaps\.md`)/m;
    expect(
      records.openTodos.filter((name) => !named.test(readFileSync(path.join(TODOS, name), "utf8"))),
    ).toEqual([]);
  });

  it("refuses a todo dated after the freeze, since new work is an issue", () => {
    const dated = records.todos.filter((name) => /^\d{4}-\d{2}-\d{2}-/.test(name));
    expect(dated.filter((name) => name.slice(0, 10) > FROZEN)).toEqual([]);
  });
});
