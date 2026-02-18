#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "scripts", "perf", "performance-thresholds.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const baseUrl = process.env.PERF_BASE_URL || process.env.CYPRESS_BASE_URL || "http://127.0.0.1:3000";
const reportDir = path.join(root, "reports", "performance", "lighthouse");
const categoryThresholds = config.lighthouse.categories;
const routes = config.lighthouse.routes;

mkdirSync(reportDir, { recursive: true });

const normalizeRouteName = (route) => {
  if (route === "/") return "home";
  return route.replaceAll("/", "-").replace(/^-+/, "");
};

let hasFailure = false;
const summary = [];

for (const route of routes) {
  const url = new URL(route, `${baseUrl}/`).toString();
  const reportName = `${normalizeRouteName(route)}.json`;
  const reportPath = path.join(reportDir, reportName);

  const run = spawnSync(
    "npx",
    [
      "--yes",
      "lighthouse",
      url,
      "--quiet",
      "--output=json",
      `--output-path=${reportPath}`,
      "--only-categories=performance,accessibility,best-practices",
      "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
    ],
    { stdio: "inherit" },
  );

  if (run.status !== 0) {
    hasFailure = true;
    summary.push({
      route,
      url,
      status: "failed_to_run",
    });
    continue;
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const categoryScores = {};

  for (const [categoryKey, threshold] of Object.entries(categoryThresholds)) {
    const score = report.categories?.[categoryKey]?.score;
    const scorePct = typeof score === "number" ? Math.round(score * 100) : 0;
    const pass = scorePct >= threshold;

    if (!pass) {
      hasFailure = true;
    }

    categoryScores[categoryKey] = {
      score: scorePct,
      threshold,
      pass,
    };
  }

  summary.push({
    route,
    url,
    status: "ok",
    categories: categoryScores,
  });
}

const summaryPath = path.join(reportDir, "summary.json");
writeFileSync(
  summaryPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl,
      thresholds: categoryThresholds,
      results: summary,
    },
    null,
    2,
  )}\n`,
);

console.log("\nLighthouse category summary:");
for (const row of summary) {
  if (row.status !== "ok") {
    console.log(`- ${row.route}: FAILED to run`);
    continue;
  }

  const formatted = Object.entries(row.categories)
    .map(([key, value]) => `${key} ${value.score}/${value.threshold}${value.pass ? "" : " (fail)"}`)
    .join(" | ");
  console.log(`- ${row.route}: ${formatted}`);
}
console.log(`\nSaved reports to: ${reportDir}`);

if (hasFailure) {
  process.exitCode = 1;
}
