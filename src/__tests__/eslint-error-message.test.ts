/**
 * @jest-environment node
 */

import * as parser from "@typescript-eslint/parser";
import { execFileSync } from "child_process";
import { Linter } from "eslint";

/**
 * A component renders `handleApiError(error)`, never `error.message`
 * (`.claude/rules/data-access.md`). `eslint.config.mjs` enforces that with two
 * `no-restricted-syntax` selectors. This checks two things:
 *
 * - the selectors reach a component file in each directory the rule covers. A
 *   later config block that sets `no-restricted-syntax` replaces the whole list,
 *   so a new block could drop them without anyone noticing;
 * - they flag the shapes an error's message is read in, and leave React Hook
 *   Form's `errors.<field>?.message` alone.
 *
 * Jest cannot import the `.mjs` config, so a child process resolves it through
 * ESLint's own API.
 */

const COMPONENT_PATHS = [
  "src/components/ui/Probe.tsx",
  "src/components/layout/Probe.tsx",
  "src/features/probe/components/Probe.tsx",
  "src/app/(app)/probe/page.tsx",
];

const RESOLVE_SCRIPT = `
const { ESLint } = await import("eslint");
const eslint = new ESLint({ cwd: process.cwd() });
const out = {};
for (const path of JSON.parse(process.argv[1])) {
  const config = await eslint.calculateConfigForFile(path);
  out[path] = config.rules["no-restricted-syntax"];
}
process.stdout.write(JSON.stringify(out));
`;

type RuleEntry = Linter.RuleEntry;

const resolved = JSON.parse(
  execFileSync(
    process.execPath,
    ["--input-type=module", "-e", RESOLVE_SCRIPT, JSON.stringify(COMPONENT_PATHS)],
    { cwd: process.cwd(), encoding: "utf8" },
  ),
) as Record<string, RuleEntry | undefined>;

const ERROR_MESSAGE_RULE = /^Render handleApiError\(error\)/;

const linter = new Linter({ configType: "flat" });

const errorMessageHits = (code: string, rule: RuleEntry) => {
  const messages = linter.verify(
    code,
    [
      {
        files: ["**/*.tsx"],
        languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
        rules: { "no-restricted-syntax": rule },
      },
    ],
    { filename: "Probe.tsx" },
  );
  // A snippet that fails to parse reports nothing, which would pass every
  // "leaves alone" case without testing it.
  expect(messages.filter((m) => m.fatal)).toEqual([]);
  return messages.filter((m) => ERROR_MESSAGE_RULE.test(m.message));
};

const featureRule = resolved["src/features/probe/components/Probe.tsx"];

describe("the rule against rendering error.message", () => {
  it.each(COMPONENT_PATHS)("is configured for %s", (path) => {
    const entry = resolved[path];
    expect(Array.isArray(entry)).toBe(true);
    const messages = (entry as unknown[])
      .slice(1)
      .map((option) => (option as { message?: string }).message ?? "");
    expect(messages.filter((m) => ERROR_MESSAGE_RULE.test(m))).toHaveLength(2);
  });

  it.each([
    "const A = ({ error }: { error: Error }) => <p>{error.message}</p>;",
    "const A = ({ error }: { error?: Error }) => <p>{error?.message}</p>;",
    "const A = ({ err }: { err: Error }) => <p>{err.message}</p>;",
    "const A = ({ e }: { e: Error }) => <p>{e.message}</p>;",
    "const A = ({ deleteError }: { deleteError: Error }) => <p>{deleteError.message}</p>;",
    "const A = ({ mutation }: { mutation: { error: Error } }) => <p>{mutation.error.message}</p>;",
    "const A = ({ query }: { query: { error?: Error } }) => <p>{query.error?.message}</p>;",
    "const A = ({ m }: { m: { createError: Error } }) => <p>{m.createError.message}</p>;",
  ])("flags %s", (code) => {
    expect(errorMessageHits(code, featureRule as RuleEntry)).toHaveLength(1);
  });

  it.each([
    "const A = ({ errors }: Props) => <p>{errors.email?.message}</p>;",
    "const A = ({ errors }: Props) => <p>{errors.displayOptions?.priority?.message}</p>;",
    "const A = ({ error }: Props) => <p>{handleApiError(error).join(', ')}</p>;",
    "const A = ({ toast }: Props) => <p>{toast.message}</p>;",
  ])("leaves %s alone", (code) => {
    expect(errorMessageHits(code, featureRule as RuleEntry)).toHaveLength(0);
  });
});
