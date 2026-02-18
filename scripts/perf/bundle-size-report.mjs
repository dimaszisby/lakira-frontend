#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "scripts", "perf", "performance-thresholds.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const chunkRoot = path.join(root, ".next", "static", "chunks");
const outputDir = path.join(root, "reports", "performance");
const outputPath = path.join(outputDir, "bundle-size-report.json");

if (!existsSync(chunkRoot)) {
  console.error("Missing .next/static/chunks. Run `npm run build` first.");
  process.exit(1);
}

const jsFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(".js")) {
      jsFiles.push(fullPath);
    }
  }
};

walk(chunkRoot);

const chunkStats = jsFiles.map((filePath) => {
  const sizeBytes = statSync(filePath).size;
  return {
    file: path.relative(root, filePath),
    sizeBytes,
  };
});

chunkStats.sort((a, b) => b.sizeBytes - a.sizeBytes);

const totalJsBytes = chunkStats.reduce((sum, chunk) => sum + chunk.sizeBytes, 0);
const largestChunkBytes = chunkStats[0]?.sizeBytes || 0;
const largestChunkFile = chunkStats[0]?.file || null;

const thresholds = config.bundleSize;
const checks = {
  totalJsBytes: {
    value: totalJsBytes,
    threshold: thresholds.maxTotalJsBytes,
    pass: totalJsBytes <= thresholds.maxTotalJsBytes,
  },
  largestChunkBytes: {
    value: largestChunkBytes,
    threshold: thresholds.maxLargestChunkBytes,
    pass: largestChunkBytes <= thresholds.maxLargestChunkBytes,
  },
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      thresholds,
      checks,
      totalChunkCount: chunkStats.length,
      largestChunkFile,
      largestChunkBytes,
      topChunks: chunkStats.slice(0, 20),
    },
    null,
    2,
  )}\n`,
);

console.log("\nBundle size summary:");
console.log(`- Chunk files: ${chunkStats.length}`);
console.log(`- Total JS bytes: ${totalJsBytes} / ${thresholds.maxTotalJsBytes}`);
console.log(`- Largest chunk: ${largestChunkBytes} / ${thresholds.maxLargestChunkBytes}`);
if (largestChunkFile) {
  console.log(`- Largest chunk file: ${largestChunkFile}`);
}
console.log(`\nSaved report to: ${outputPath}`);

if (!checks.totalJsBytes.pass || !checks.largestChunkBytes.pass) {
  process.exitCode = 1;
}
