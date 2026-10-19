// How old the local backend image is, for the stack preflight (cypress/support/stack.ts). Runs on
// the Node side, as a Cypress task. Twice the stack suite ran against an image days behind backend
// `dev`, and a third time for a week, with nothing to say so (register row F-51).
//
// By commit when the image names one: backend #190 bakes `APP_RELEASE` into the dev image and
// `/health` reports it, so the check asks GitHub which `dev` commits that commit lacks (row F-61).
// Otherwise by date, the image's creation time against the commits on backend `dev`, which an
// image built from another branch after the newest `dev` commit still passes.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const COMMITS_URL = "https://api.github.com/repos/dimaszisby/lakira-backend/commits";
const COMPARE_URL = "https://api.github.com/repos/dimaszisby/lakira-backend/compare";
const REBUILD =
  "APP_RELEASE=$(git -C ../lakira-backend rev-parse HEAD) docker compose -f ../lakira-backend/docker-compose.yml up -d --build mailpit app";
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
  /** The commit the image was built from; set when the check went by commit, not by date. */
  release?: string;
  /** Why a date check could not go by commit, shown after its verdict. */
  dateNote?: string;
};

/** A commit hash as `/health` reports `release`: not `unknown`, not empty. */
export const isCommitSha = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{7,40}$/.test(value);

/** The verdict, with the message the preflight shows. Pure, so it can be unit tested. */
export const assessBackendFreshness = ({
  createdAt,
  commits,
  allowStale,
  reason,
  release,
  dateNote,
}: Input): BackendFreshness => {
  const short = release?.slice(0, 7);
  if (!release && (!createdAt || reason)) {
    return {
      status: "unknown",
      message: `Backend image age not checked: ${reason ?? "no creation time"}.`,
    };
  }
  const note = !release && dateNote ? [dateNote] : [];
  if (commits.length === 0) {
    const verdict = release
      ? `Backend image built from ${short}, which has every commit on backend dev.`
      : `Backend image built ${createdAt}, after backend dev.`;
    return { status: "fresh", message: [verdict, ...note].join("\n") };
  }

  const listed = commits.slice(0, LISTED).map((c) => `  ${c.sha} ${c.date} ${c.subject}`);
  const more = commits.length > LISTED ? [`  and ${commits.length - LISTED} more`] : [];
  const lines = [
    release
      ? `The local backend image was built from ${short}; backend dev has ${commits.length} commits it lacks:`
      : `The local backend image was built ${createdAt}; backend dev has ${commits.length} commits since:`,
    ...listed,
    ...more,
    ...note,
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

const toBackendCommit = (c: GitHubCommit): BackendCommit => ({
  sha: c.sha.slice(0, 7),
  date: c.commit.committer.date,
  subject: c.commit.message.split("\n")[0] ?? "",
});

/** The `release` the running backend reports on `/health`, or null if it cannot be read. */
const healthRelease = async (backendUrl: string): Promise<unknown> => {
  try {
    const response = await fetch(`${backendUrl}/health`);
    if (!response.ok) return null;
    return ((await response.json()) as { release?: unknown }).release ?? null;
  } catch {
    return null;
  }
};

/** Commits on backend `dev` that `release` lacks, or null when GitHub does not know the commit. */
const commitsMissingFrom = async (release: string): Promise<BackendCommit[] | null> => {
  const response = await fetch(`${COMPARE_URL}/${release}...dev`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const body = (await response.json()) as { ahead_by: number; commits: GitHubCommit[] };
  // `commits` is oldest first; list the newest first, as the date check does.
  return body.commits.slice(0, body.ahead_by).reverse().map(toBackendCommit);
};

/** Commits on backend `dev` after `since`. The repository is public, so no token is needed. */
const commitsSince = async (since: string): Promise<BackendCommit[]> => {
  const response = await fetch(`${COMMITS_URL}?sha=dev&per_page=100&since=${since}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const body = (await response.json()) as GitHubCommit[];
  return body.map(toBackendCommit);
};

let memo: Promise<BackendFreshness> | undefined;

/**
 * Reads the image's commit or age, and backend `dev`'s commits, once per Cypress run: every stack
 * spec's preflight asks, and GitHub allows 60 unauthenticated calls an hour.
 */
export const backendFreshness = (container: string, allowStale: boolean, backendUrl: string) => {
  memo ??= (async () => {
    const release = await healthRelease(backendUrl);
    let dateNote = `Checked by date: the backend reports no commit (release ${JSON.stringify(release)}).`;
    if (isCommitSha(release)) {
      try {
        const missing = await commitsMissingFrom(release);
        if (missing)
          return assessBackendFreshness({ createdAt: null, commits: missing, allowStale, release });
        dateNote = `Checked by date: GitHub does not know the image's commit ${release.slice(0, 7)}.`;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        dateNote = `Checked by date: comparing commit ${release.slice(0, 7)} failed (${detail}).`;
      }
    }

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
      return assessBackendFreshness({ createdAt, commits, allowStale, dateNote });
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
