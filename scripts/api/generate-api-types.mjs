#!/usr/bin/env node
/**
 * Generate (or drift-check) the TypeScript types derived from the OpenAPI snapshot.
 *
 *   node scripts/api/generate-api-types.mjs           # write the types
 *   node scripts/api/generate-api-types.mjs --check   # exit 1 if committed types are stale
 *
 * The snapshot itself is synced by scripts/api/sync-openapi-spec.mjs. Run that first
 * if the backend has shipped a contract change.
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const run = promisify(execFile);

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const SNAPSHOT = path.join(REPO_ROOT, "documents", "openapi", "lakira-backend-openapi.json");
const OUT_DIR = path.join(REPO_ROOT, "src", "types", "api", "generated");
const OUT_FILE = path.join(OUT_DIR, "lakira-backend.d.ts");
const BIN = path.join(REPO_ROOT, "node_modules", ".bin", "openapi-typescript");

const isCheck = process.argv.includes("--check");

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const BANNER = `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source:    documents/openapi/lakira-backend-openapi.json
 * Regenerate: npm run api:types:generate
 * Drift gate: npm run api:types:check (runs in CI as the api-contract job)
 */

`;

async function generate() {
  if (!existsSync(SNAPSHOT)) {
    fail("no OpenAPI snapshot found. Run 'npm run api:spec:sync' first.");
  }

  if (!existsSync(BIN)) {
    fail("openapi-typescript is not installed. Run 'npm ci'.");
  }

  const { stdout } = await run(BIN, [SNAPSHOT], {
    cwd: REPO_ROOT,
    maxBuffer: 32 * 1024 * 1024,
  });

  return BANNER + stdout;
}

async function main() {
  const generated = await generate();
  const committed = existsSync(OUT_FILE) ? await readFile(OUT_FILE, "utf8") : null;

  if (committed === generated) {
    console.log("✓ generated API types are in sync with the OpenAPI snapshot");
    return;
  }

  if (isCheck) {
    console.error("");
    console.error(
      committed === null ? "  committed types are missing" : "  committed types differ",
    );
    console.error("");
    fail("generated API types are stale. Run 'npm run api:types:generate' and commit the result.");
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, generated, "utf8");
  console.log(`✓ wrote ${path.relative(REPO_ROOT, OUT_FILE)}`);
}

await main();
