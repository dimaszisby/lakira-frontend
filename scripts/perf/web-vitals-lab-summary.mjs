#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "scripts", "perf", "performance-thresholds.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const reportDir = path.join(root, "reports", "performance", "lighthouse");
const outputPath = path.join(root, "reports", "performance", "web-vitals-lab-summary.json");

const thresholds = config.webVitals;
const routes = config.lighthouse.routes;

const normalizeRouteName = (route) => {
  if (route === "/") return "home";
  return route.replaceAll("/", "-").replace(/^-+/, "");
};

const getAuditNumericValue = (report, keys) => {
  for (const key of keys) {
    const value = report?.audits?.[key]?.numericValue;
    if (typeof value === "number") {
      return value;
    }
  }
  return null;
};

const results = [];
let hasFailure = false;

for (const route of routes) {
  const reportPath = path.join(reportDir, `${normalizeRouteName(route)}.json`);
  if (!existsSync(reportPath)) {
    hasFailure = true;
    results.push({
      route,
      status: "missing_lighthouse_report",
    });
    continue;
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8"));

  const lcpMs = getAuditNumericValue(report, ["largest-contentful-paint"]);
  const cls = getAuditNumericValue(report, ["cumulative-layout-shift"]);
  const inpMs = getAuditNumericValue(report, [
    "interaction-to-next-paint",
    "experimental-interaction-to-next-paint",
  ]);

  const lcpPass = typeof lcpMs === "number" && lcpMs <= thresholds.lcpMs;
  const clsPass = typeof cls === "number" && cls <= thresholds.cls;
  const inpAvailable = typeof inpMs === "number";
  const inpPass = !inpAvailable || inpMs <= thresholds.inpMs;

  if (!lcpPass || !clsPass || !inpPass) {
    hasFailure = true;
  }

  results.push({
    route,
    status: "ok",
    metrics: {
      lcpMs: {
        value: lcpMs,
        threshold: thresholds.lcpMs,
        pass: lcpPass,
      },
      cls: {
        value: cls,
        threshold: thresholds.cls,
        pass: clsPass,
      },
      inpMs: {
        value: inpMs,
        threshold: thresholds.inpMs,
        available: inpAvailable,
        pass: inpPass,
      },
    },
  });
}

writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      thresholds,
      results,
    },
    null,
    2,
  )}\n`,
);

console.log("\nWeb Vitals (Lab) summary:");
for (const row of results) {
  if (row.status !== "ok") {
    console.log(`- ${row.route}: missing Lighthouse report`);
    continue;
  }

  const lcp = row.metrics.lcpMs;
  const cls = row.metrics.cls;
  const inp = row.metrics.inpMs;

  const metricSummary = [
    `LCP ${lcp.value}ms/${lcp.threshold}${lcp.pass ? "" : " (fail)"}`,
    `CLS ${cls.value}/${cls.threshold}${cls.pass ? "" : " (fail)"}`,
    inp.available
      ? `INP ${inp.value}ms/${inp.threshold}${inp.pass ? "" : " (fail)"}`
      : "INP n/a (no lab interaction sample)",
  ].join(" | ");

  console.log(`- ${row.route}: ${metricSummary}`);
}
console.log(`\nSaved report to: ${outputPath}`);

if (hasFailure) {
  process.exitCode = 1;
}
