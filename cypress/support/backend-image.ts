// How old the local backend image is, for the stack preflight (cypress/support/stack.ts). Runs on
// the Node side, as a Cypress task. Twice the stack suite ran against an image days behind backend
// `dev`, and a third time for a week, with nothing to say so (register row F-51).
//
// The test is by date: the image's creation time against the commits on backend `dev`. The
// backend reports no commit of its own (its `/health` says `release: "unknown"`, row F-61), so an
// image built from another branch after the newest `dev` commit still passes.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const COMMITS_URL = "https://api.github.com/repos/dimaszisby/lakira-backend/commits";
const REBUILD = "docker compose -f ../lakira-backend/docker-compose.yml up -d --build mailpit app";
const LISTED = 5;

export type BackendCommit = { sha: string; date: string; subject: string };

export type BackendFreshness = {
  status: "fresh" | "stale" | "allowed" | "unknown";
  message: string;
};

type Input = {
  createdAt: string | null;
  commits: BackendCommit[];
  allowStale: boolean;
  /** Why the age or the commits could not be read, when they could not. */
  reason?: string;
};

/** The verdict, with the message the preflight shows. Pure, so it can be unit tested. */
export const assessBackendFreshness = ({
  createdAt,
  commits,
  allowStale,
  reason,
}: Input): BackendFreshness => {
  if (!createdAt || reason) {
    return {
      status: "unknown",
      message: `Backend image age not checked: ${reason ?? "no creation time"}.`,
    };
  }
  if (commits.length === 0) {
    return { status: "fresh", message: `Backend image built ${createdAt}, after backend dev.` };
  }

  const listed = commits.slice(0, LISTED).map((c) => `  ${c.sha} ${c.date} ${c.subject}`);
  const more = commits.length > LISTED ? [`  and ${commits.length - LISTED} more`] : [];
  const lines = [
    `The local backend image was built ${createdAt}; backend dev has ${commits.length} commits since:`,
    ...listed,
    ...more,
  ];

  if (allowStale) {
    return {
      status: "allowed",
      message: [...lines, "Running anyway: E2E_ALLOW_STALE_BACKEND is set."].join("\n"),
    };
  }
  return {
    status: "stale",
    message: [
      ...lines,
      "",
      "A stack run against it tests that older backend. Rebuild it, then run again:",
      `  ${REBUILD}`,
      "To run against it anyway, set E2E_ALLOW_STALE_BACKEND=1.",
      "See docs/how-to/testing/run-stack-e2e.md.",
    ].join("\n"),
  };
};

/** The creation time of the image `container` runs, not of the container itself. */
const imageCreatedAt = async (container: string): Promise<string> => {
  const { stdout: image } = await run("docker", ["inspect", "--format", "{{.Image}}", container]);
  const { stdout: created } = await run("docker", [
    "image",
    "inspect",
    "--format",
    "{{.Created}}",
    image.trim(),
  ]);
  return new Date(created.trim()).toISOString();
};

type GitHubCommit = { sha: string; commit: { committer: { date: string }; message: string } };

/** Commits on backend `dev` after `since`. The repository is public, so no token is needed. */
const commitsSince = async (since: string): Promise<BackendCommit[]> => {
  const response = await fetch(`${COMMITS_URL}?sha=dev&per_page=100&since=${since}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const body = (await response.json()) as GitHubCommit[];
  return body.map((c) => ({
    sha: c.sha.slice(0, 7),
    date: c.commit.committer.date,
    subject: c.commit.message.split("\n")[0] ?? "",
  }));
};

let memo: Promise<BackendFreshness> | undefined;

/**
 * Reads the image's age and backend `dev`'s commits once per Cypress run: every stack spec's
 * preflight asks, and GitHub allows 60 unauthenticated calls an hour.
 */
export const backendFreshness = (container: string, allowStale: boolean) => {
  memo ??= (async () => {
    let createdAt: string;
    try {
      createdAt = await imageCreatedAt(container);
    } catch (error) {
      const detail = error instanceof Error ? error.message.split("\n")[0] : String(error);
      return assessBackendFreshness({
        createdAt: null,
        commits: [],
        allowStale,
        reason: `could not inspect the container "${container}" (${detail})`,
      });
    }
    try {
      const commits = await commitsSince(createdAt);
      return assessBackendFreshness({ createdAt, commits, allowStale });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return assessBackendFreshness({
        createdAt,
        commits: [],
        allowStale,
        reason: `could not read backend dev's commits (${detail})`,
      });
    }
  })();
  return memo;
};
