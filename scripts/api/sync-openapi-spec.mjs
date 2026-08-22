#!/usr/bin/env node
/**
 * Sync (or drift-check) the committed OpenAPI snapshot against lakira-backend.
 *
 *   node scripts/api/sync-openapi-spec.mjs           # write the snapshot
 *   node scripts/api/sync-openapi-spec.mjs --check   # exit 1 on any difference
 *
 * Source resolution, in order:
 *   1. $LAKIRA_OPENAPI_URL              explicit URL override
 *   2. $LAKIRA_BACKEND_PATH/docs/...    local checkout — opt-in only
 *   3. the public raw.githubusercontent URL below (the default)
 *
 * The local checkout is deliberately NOT auto-detected: a sibling clone is
 * usually sitting on some feature branch, and syncing from it would commit a
 * spec that is not on any shared branch. Set $LAKIRA_BACKEND_PATH when you
 * genuinely want that, e.g. while co-developing a contract change.
 *
 * The backend's runtime /api/v1/docs/openapi.json requires auth unless
 * SWAGGER_REQUIRE_AUTH=false, so it is not used as a source here.
 *
 * NOTE ON THE BRANCH: the committed spec exists only on lakira-backend's `dev`
 * branch — it has never been promoted to `staging` or `main`. So `dev` is the
 * only usable source, and it therefore describes a backend that is *ahead of*
 * the staging deployment this app's preview environment talks to. Endpoints in
 * the generated types may not exist on staging yet. Override with
 * $LAKIRA_OPENAPI_BRANCH once the backend starts promoting the spec.
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const SNAPSHOT = path.join(REPO_ROOT, "documents", "openapi", "lakira-backend-openapi.json");
const SPEC_SUBPATH = path.join("docs", "reference", "api", "lakira-backend-openapi.json");
const BRANCH = process.env.LAKIRA_OPENAPI_BRANCH ?? "dev";
const DEFAULT_URL = `https://raw.githubusercontent.com/dimaszisby/lakira-backend/${BRANCH}/docs/reference/api/lakira-backend-openapi.json`;

const isCheck = process.argv.includes("--check");

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

async function resolveSource() {
  if (process.env.LAKIRA_OPENAPI_URL) {
    return { kind: "url", location: process.env.LAKIRA_OPENAPI_URL };
  }

  if (process.env.LAKIRA_BACKEND_PATH) {
    const localSpec = path.join(process.env.LAKIRA_BACKEND_PATH, SPEC_SUBPATH);

    if (!existsSync(localSpec)) {
      fail(`LAKIRA_BACKEND_PATH is set but ${localSpec} does not exist`);
    }

    return { kind: "file", location: localSpec };
  }

  return { kind: "url", location: DEFAULT_URL };
}

async function fetchSource({ kind, location }) {
  if (kind === "file") {
    return readFile(location, "utf8");
  }

  const response = await fetch(location);

  if (!response.ok) {
    fail(`could not fetch ${location} — HTTP ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/** Stable stringify so key order never registers as drift. */
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
};

const serialize = (json) => `${JSON.stringify(canonical(json), null, 2)}\n`;

function diffPaths(before, after) {
  const oldPaths = new Set(Object.keys(before?.paths ?? {}));
  const newPaths = new Set(Object.keys(after?.paths ?? {}));

  return {
    added: [...newPaths].filter((p) => !oldPaths.has(p)).sort(),
    removed: [...oldPaths].filter((p) => !newPaths.has(p)).sort(),
    kept: [...newPaths].filter((p) => oldPaths.has(p)).sort(),
  };
}

function changedOperations(before, after, kept) {
  return kept.filter(
    (p) => JSON.stringify(canonical(before.paths[p])) !== JSON.stringify(canonical(after.paths[p])),
  );
}

async function main() {
  const source = await resolveSource();
  const upstreamRaw = await fetchSource(source);

  let upstream;
  try {
    upstream = JSON.parse(upstreamRaw);
  } catch {
    fail(`source at ${source.location} is not valid JSON`);
  }

  if (!upstream?.paths) {
    fail(`source at ${source.location} has no "paths" — is it an OpenAPI document?`);
  }

  const local = existsSync(SNAPSHOT) ? JSON.parse(await readFile(SNAPSHOT, "utf8")) : null;

  const next = serialize(upstream);
  const current = local ? serialize(local) : null;

  console.log(`source: ${source.location}`);

  if (current === next) {
    console.log(`✓ snapshot is in sync — ${Object.keys(upstream.paths).length} paths`);
    return;
  }

  const { added, removed, kept } = diffPaths(local ?? { paths: {} }, upstream);
  const changed = local ? changedOperations(local, upstream, kept) : [];

  console.log("");
  console.log(`  local:    ${local ? Object.keys(local.paths).length : 0} paths`);
  console.log(`  upstream: ${Object.keys(upstream.paths).length} paths`);
  console.log("");
  for (const p of added) console.log(`  + ${p}`);
  for (const p of removed) console.log(`  - ${p}`);
  for (const p of changed) console.log(`  ~ ${p}`);
  console.log("");

  if (isCheck) {
    fail(
      "OpenAPI snapshot is out of date. Run 'npm run api:spec:sync' " +
        "then 'npm run api:types:generate' and commit both.",
    );
  }

  await writeFile(SNAPSHOT, next, "utf8");
  console.log(`✓ wrote ${path.relative(REPO_ROOT, SNAPSHOT)}`);
  console.log("  next: npm run api:types:generate");
}

await main();
