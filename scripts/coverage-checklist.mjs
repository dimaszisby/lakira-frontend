#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const coverageSummaryPath = path.join(root, "coverage", "coverage-summary.json");
const goalsPath = path.join(root, "coverage-goals.json");

if (!existsSync(coverageSummaryPath)) {
  console.error(
    "coverage/coverage-final.json not found. Run `npm run test:unit:ci` first to generate coverage data.",
  );
  process.exit(1);
}

if (!existsSync(goalsPath)) {
  console.error("coverage-goals.json not found. Create it to list per-folder targets.");
  process.exit(1);
}

const summary = JSON.parse(readFileSync(coverageSummaryPath, "utf-8"));
const goals = JSON.parse(readFileSync(goalsPath, "utf-8"));

const coverageEntries = Object.entries(summary)
  .filter(([key]) => key !== "total")
  .map(([key, metrics]) => {
    const relPath = path.relative(root, key);
    return [relPath, metrics];
  });

function aggregateForPrefix(prefix) {
  const totals = {
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 },
  };

  coverageEntries.forEach(([file, metrics]) => {
    if (!file.startsWith(prefix)) return;
    ["statements", "branches", "functions", "lines"].forEach((key) => {
      totals[key].total += metrics[key].total;
      totals[key].covered += metrics[key].covered;
    });
  });

  const pct = (key) => {
    const { total, covered } = totals[key];
    return total === 0 ? 0 : (covered / total) * 100;
  };

  return {
    statements: pct("statements"),
    branches: pct("branches"),
    functions: pct("functions"),
    lines: pct("lines"),
  };
}

console.log("Coverage checklist (targets from coverage-goals.json)\n");
let unmet = 0;
const strict = process.argv.includes("--strict");

Object.entries(goals).forEach(([prefix, target]) => {
  const stats = aggregateForPrefix(prefix);
  const met = stats.statements >= target;
  if (!met) unmet += 1;
  const status = met ? "✔" : "✖";
  console.log(
    `${status} ${prefix} → statements ${stats.statements.toFixed(2)}% (goal ${target}%)`,
  );
});

console.log(
  "\nTip: edit coverage-goals.json to raise thresholds as suites expand. This script only checks statement coverage for each folder prefix.",
);

if (strict && unmet > 0) {
  process.exitCode = 1;
}
