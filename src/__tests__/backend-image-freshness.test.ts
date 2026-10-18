import { assessBackendFreshness } from "../../cypress/support/backend-image";

// The stack preflight's verdict on the local backend image (register row F-51). The parts that
// call Docker and GitHub are not tested here; this is the decision they feed. Jest ignores
// `cypress/`, so the test sits here.

const CREATED = "2026-10-13T13:08:08.000Z";
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
      commits: [commit("fix(deps): one"), commit("fix(auth): two")],
      allowStale: false,
    });

    expect(result.status).toBe("stale");
    expect(result.message).toContain("2 commits");
    expect(result.message).toContain(CREATED);
    expect(result.message).toContain("fix(auth): two");
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
});
