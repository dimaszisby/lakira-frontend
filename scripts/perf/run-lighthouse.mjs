#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "scripts", "perf", "performance-thresholds.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const baseUrl =
  process.env.PERF_BASE_URL || process.env.CYPRESS_BASE_URL || "http://127.0.0.1:3000";
const reportDir = path.join(root, "reports", "performance", "lighthouse");
const categoryThresholds = config.lighthouse.categories;
const routes = config.lighthouse.routes;
// Pinned so a score cannot move because a newer Lighthouse was published.
const lighthouseVersion = config.lighthouse.version;
// A single Lighthouse run is noisy; the gate compares the median of several.
const runsPerRoute = config.lighthouse.runsPerRoute;

mkdirSync(reportDir, { recursive: true });

const normalizeRouteName = (route) => {
  if (route === "/") return "home";
  return route.replaceAll("/", "-").replace(/^-+/, "");
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const toPct = (report, categoryKey) => {
  const score = report.categories?.[categoryKey]?.score;
  return typeof score === "number" ? Math.round(score * 100) : 0;
};

const finalPath = (report) => new URL(report.finalDisplayedUrl ?? report.finalUrl).pathname;

let hasFailure = false;
const summary = [];

for (const route of routes) {
  const url = new URL(route, `${baseUrl}/`).toString();
  const name = normalizeRouteName(route);
  const runs = [];
  let failedToRun = false;

  for (let run = 1; run <= runsPerRoute; run++) {
    const runPath = path.join(reportDir, `${name}.run-${run}.json`);
    const result = spawnSync(
      "npx",
      [
        "--yes",
        `lighthouse@${lighthouseVersion}`,
        url,
        "--quiet",
        "--output=json",
        `--output-path=${runPath}`,
        "--only-categories=performance,accessibility,best-practices",
        "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
      ],
      { stdio: "inherit" },
    );

    if (result.status !== 0) {
      failedToRun = true;
      break;
    }

    runs.push({ path: runPath, report: JSON.parse(readFileSync(runPath, "utf8")) });
  }

  if (failedToRun) {
    hasFailure = true;
    summary.push({ route, url, status: "failed_to_run" });
    continue;
  }

  // A protected route with no session redirects to /login; scoring that would
  // report the login page under this route's name.
  const redirectedTo = runs.map(({ report }) => finalPath(report)).find((p) => p !== route);
  if (redirectedTo) {
    hasFailure = true;
    summary.push({ route, url, status: "redirected", redirectedTo });
    continue;
  }

  // The run with the median performance score becomes the route's report, so
  // the lab Web Vitals derived from it come from one real, representative run.
  const byPerformance = [...runs].sort(
    (a, b) => toPct(a.report, "performance") - toPct(b.report, "performance"),
  );
  copyFileSync(
    byPerformance[Math.floor(byPerformance.length / 2)].path,
    path.join(reportDir, `${name}.json`),
  );

  const categoryScores = {};

  for (const [categoryKey, threshold] of Object.entries(categoryThresholds)) {
    const runScores = runs.map(({ report }) => toPct(report, categoryKey));
    const scorePct = median(runScores);
    const pass = scorePct >= threshold;

    if (!pass) {
      hasFailure = true;
    }

    categoryScores[categoryKey] = {
      score: scorePct,
      runs: runScores,
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
      lighthouseVersion,
      runsPerRoute,
      thresholds: categoryThresholds,
      results: summary,
    },
    null,
    2,
  )}\n`,
);

console.log(`\nLighthouse ${lighthouseVersion}, median of ${runsPerRoute} runs per route:`);
for (const row of summary) {
  if (row.status === "redirected") {
    console.log(`- ${row.route}: REDIRECTED to ${row.redirectedTo}, not measured`);
    continue;
  }
  if (row.status !== "ok") {
    console.log(`- ${row.route}: FAILED to run`);
    continue;
  }

  const formatted = Object.entries(row.categories)
    .map(
      ([key, value]) =>
        `${key} ${value.score}/${value.threshold}${value.pass ? "" : " (fail)"} [${value.runs.join(", ")}]`,
    )
    .join(" | ");
  console.log(`- ${row.route}: ${formatted}`);
}
console.log(`\nSaved reports to: ${reportDir}`);

if (hasFailure) {
  process.exitCode = 1;
}
