import {
  authRoutes,
  buildPath,
  dashboardRoute,
  metricCategoryRoutes,
  metricRoutes,
} from "@/lib/routes";

const METRIC_ID = "m-1";
const CATEGORY_ID = "c-1";
const RETURN_URL = "/metrics?page=2";
const ENCODED_RETURN_URL = "%2Fmetrics%3Fpage%3D2";

describe("buildPath", () => {
  it("returns the base path when there is no query", () => {
    expect(buildPath("/metrics")).toBe("/metrics");
  });

  it("returns the base path when every value is empty", () => {
    expect(buildPath("/metrics", { q: undefined, page: null })).toBe("/metrics");
  });

  it("serializes keys in sorted order with arrays, nested objects and booleans", () => {
    const path = buildPath("/x", {
      tags: ["x", "y"],
      b: 1,
      filter: { z: "1", a: "2" },
      a: "hi there",
      flag: true,
      skip: undefined,
    });

    expect(path).toBe(
      "/x?a=hi%20there&b=1&filter%5Ba%5D=2&filter%5Bz%5D=1&flag=true&tags%5B%5D=x&tags%5B%5D=y",
    );
  });

  it("appends to a base path that already has a query string", () => {
    expect(buildPath("/x?mode=pages", { page: 2 })).toBe("/x?mode=pages&page=2");
  });
});

describe("authRoutes", () => {
  it("carries a safe relative return URL", () => {
    expect(authRoutes.login(RETURN_URL)).toBe(`/login?returnUrl=${ENCODED_RETURN_URL}`);
    expect(authRoutes.register(RETURN_URL)).toBe(`/register?returnUrl=${ENCODED_RETURN_URL}`);
    expect(authRoutes.afterAuth(RETURN_URL)).toBe(RETURN_URL);
  });

  it.each(["//evil.example", "https://evil.example", "metrics", null, undefined, ""])(
    "drops the unsafe return URL %p",
    (returnUrl) => {
      expect(authRoutes.login(returnUrl)).toBe("/login");
      expect(authRoutes.register(returnUrl)).toBe("/register");
      expect(authRoutes.afterAuth(returnUrl)).toBe("/dashboard");
    },
  );

  it("builds token links only when a token is present", () => {
    expect(authRoutes.resetPassword("abc")).toBe("/reset-password?token=abc");
    expect(authRoutes.resetPassword(null)).toBe("/reset-password");
    expect(authRoutes.verifyEmail("xyz")).toBe("/verify-email?token=xyz");
    expect(authRoutes.verifyEmail()).toBe("/verify-email");
  });

  it("returns the static account paths", () => {
    expect(authRoutes.account()).toBe("/account");
    expect(authRoutes.organization()).toBe("/organization");
    expect(authRoutes.forgotPassword()).toBe("/forgot-password");
  });
});

describe("metricRoutes", () => {
  it("builds list and detail paths", () => {
    expect(metricRoutes.list()).toBe("/metrics");
    expect(metricRoutes.list({ page: 2 })).toBe("/metrics?page=2");
    expect(metricRoutes.detail(METRIC_ID)).toBe("/metrics/m-1");
    expect(metricRoutes.overview(METRIC_ID, { bucket: "1d" })).toBe("/metrics/m-1?bucket=1d");
    expect(metricRoutes.logs(METRIC_ID)).toBe("/metrics/m-1/logs");
    expect(metricRoutes.settings(METRIC_ID)).toBe("/metrics/m-1/settings");
  });

  it("builds modal paths, defaulting a log to new", () => {
    expect(metricRoutes.modal.new()).toBe("/metrics/new");
    expect(metricRoutes.modal.edit(METRIC_ID)).toBe("/metrics/m-1/edit");
    expect(metricRoutes.modal.log(METRIC_ID)).toBe("/metrics/m-1/logs/new");
    expect(metricRoutes.modal.log(METRIC_ID, "l-9")).toBe("/metrics/m-1/logs/l-9");
  });
});

describe("metricCategoryRoutes and dashboardRoute", () => {
  it("builds category paths", () => {
    expect(metricCategoryRoutes.list({ q: "sleep" })).toBe("/metric-categories?q=sleep");
    expect(metricCategoryRoutes.detail(CATEGORY_ID)).toBe("/metric-categories/c-1");
    expect(metricCategoryRoutes.modal.new()).toBe("/metric-categories/new");
    expect(metricCategoryRoutes.modal.edit(CATEGORY_ID)).toBe("/metric-categories/c-1/edit");
  });

  it("builds the dashboard path", () => {
    expect(dashboardRoute()).toBe("/dashboard");
    expect(dashboardRoute({ range: "7d" })).toBe("/dashboard?range=7d");
  });
});
