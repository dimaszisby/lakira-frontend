import { assessBackendFreshness, isCommitSha } from "../../cypress/support/backend-image";

// The stack preflight's verdict on the local backend image (register row F-51). The parts that
// call Docker and GitHub are not tested here; this is the decision they feed. Jest ignores
// `cypress/`, so the test sits here.

const CREATED = "2026-10-13T13:08:08.000Z";
const SECOND = "fix(auth): two";
const commit = (subject: string) => ({ sha: "324fb19", date: "2026-10-17T19:46:35Z", subject });

describe("assessBackendFreshness", () => {
  it("passes an image with no backend commit after it", () => {
    expect(
      assessBackendFreshness({ createdAt: CREATED, commits: [], allowStale: false }),
    ).toMatchObject({ status: "fresh" });
  });

  it("fails an older image, naming the count, the commits and the rebuild", () => {
    const result = assessBackendFreshness({
      createdAt: CREATED,
      commits: [commit("fix(deps): one"), commit(SECOND)],
      allowStale: false,
    });

    expect(result.status).toBe("stale");
    expect(result.message).toContain("2 commits");
    expect(result.message).toContain(CREATED);
    expect(result.message).toContain(SECOND);
    expect(result.message).toContain("up -d --build mailpit app");
    expect(result.message).toContain("E2E_ALLOW_STALE_BACKEND=1");
  });

  it("lists at most five commits", () => {
    const commits = Array.from({ length: 7 }, (_, i) => commit(`fix: number ${i}`));
    const { message } = assessBackendFreshness({ createdAt: CREATED, commits, allowStale: false });

    expect(message).toContain("7 commits");
    expect(message).toContain("fix: number 4");
    expect(message).not.toContain("fix: number 5");
  });

  it("lets an older image through when the run allows it, and says so", () => {
    const result = assessBackendFreshness({
      createdAt: CREATED,
      commits: [commit("fix: one")],
      allowStale: true,
    });

    expect(result.status).toBe("allowed");
    expect(result.message).toMatch(/E2E_ALLOW_STALE_BACKEND/);
  });

  it("reports the check as not run when the image's age is unknown", () => {
    const result = assessBackendFreshness({
      createdAt: null,
      commits: [],
      allowStale: false,
      reason: "no container named node_app",
    });

    expect(result.status).toBe("unknown");
    expect(result.message).toContain("no container named node_app");
  });

  describe("by commit, when the image names one (row F-61)", () => {
    const RELEASE = "cb2553101d80f142c08b601341f50d235bd1b3f9";

    it("passes an image that has every commit on backend dev, naming it", () => {
      const result = assessBackendFreshness({
        createdAt: null,
        commits: [],
        allowStale: false,
        release: RELEASE,
      });

      expect(result.status).toBe("fresh");
      expect(result.message).toContain("built from cb25531");
    });

    it("fails an image that lacks commits on backend dev, listing them", () => {
      const result = assessBackendFreshness({
        createdAt: null,
        commits: [commit("fix(api): one"), commit(SECOND)],
        allowStale: false,
        release: RELEASE,
      });

      expect(result.status).toBe("stale");
      expect(result.message).toContain("built from cb25531; backend dev has 2 commits it lacks");
      expect(result.message).toContain(SECOND);
      expect(result.message).toContain("APP_RELEASE=$(git -C ../lakira-backend rev-parse HEAD)");
    });
  });

  it("says why a date check could not go by commit", () => {
    const { message } = assessBackendFreshness({
      createdAt: CREATED,
      commits: [],
      allowStale: false,
      dateNote: 'Checked by date: the backend reports no commit (release "unknown").',
    });

    expect(message).toContain("after backend dev");
    expect(message).toContain('release "unknown"');
  });
});

describe("isCommitSha", () => {
  it("accepts a full and a short commit hash", () => {
    expect(isCommitSha("cb2553101d80f142c08b601341f50d235bd1b3f9")).toBe(true);
    expect(isCommitSha("cb25531")).toBe(true);
  });

  it("rejects what an image built without APP_RELEASE reports", () => {
    expect(isCommitSha("unknown")).toBe(false);
    expect(isCommitSha("")).toBe(false);
    expect(isCommitSha(null)).toBe(false);
  });
});
