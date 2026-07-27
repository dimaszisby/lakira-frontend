import {
  clampSort,
  createCursorSort,
  isSortParam,
  isSortableKey,
  nextSortForColumn,
  parseSort,
  toSortParam,
} from "@/lib/sort/cursorSort";

const KEYS = ["createdAt", "name", "logCount"] as const;

describe("cursorSort helpers", () => {
  it("validates sortable keys and params", () => {
    expect(isSortableKey("name", KEYS)).toBe(true);
    expect(isSortableKey("unknown", KEYS)).toBe(false);
    expect(isSortParam("-logCount", KEYS)).toBe(true);
    expect(isSortParam("-unknown", KEYS)).toBe(false);
  });

  it("parses and builds sort params", () => {
    expect(parseSort("-createdAt")).toEqual({ field: "createdAt", dir: "DESC" });
    expect(parseSort("name")).toEqual({ field: "name", dir: "ASC" });
    expect(toSortParam("logCount", "DESC")).toBe("-logCount");
    expect(toSortParam("logCount", "ASC")).toBe("logCount");
  });

  it("clamps invalid params to fallback", () => {
    expect(clampSort("-createdAt", KEYS, "-name")).toBe("-createdAt");
    expect(clampSort("invalid", KEYS, "-name")).toBe("-name");
  });

  it("toggles next sort intelligently", () => {
    expect(nextSortForColumn("-createdAt", "createdAt")).toBe("createdAt");
    expect(
      nextSortForColumn("name", "logCount", {
        descByDefault: ["logCount"],
      }),
    ).toBe("-logCount");
  });

  it("createCursorSort wires feature-specific helpers", () => {
    const metricSort = createCursorSort({
      keys: KEYS,
      defaultDesc: ["createdAt", "logCount"],
      defaultSort: "-createdAt",
    });

    expect(metricSort.KEYS).toEqual(KEYS);
    expect(metricSort.DEFAULT_SORT).toBe("-createdAt");
    expect(metricSort.isKey("name")).toBe(true);
    expect(metricSort.toSortParam("name", "ASC")).toBe("name");
    expect(metricSort.nextSortForColumn("-createdAt", "createdAt")).toBe("createdAt");

    const sp = new URLSearchParams({ sort: "-logCount" });
    expect(metricSort.sortFromSearchParams(sp)).toBe("-logCount");
    sp.set("sort", "invalid");
    expect(metricSort.sortFromSearchParams(sp)).toBe("-createdAt");
  });
});
