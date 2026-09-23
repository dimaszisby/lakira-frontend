import {
  clampSort,
  createCursorSort,
  isSortableKey,
  isSortParam,
  nextSortForColumn,
  parseSort,
  toSortParam,
} from "@/lib/sort/cursorSort";

const CREATED_AT = "createdAt";
const CREATED_AT_DESC = "-createdAt";

const KEYS = [CREATED_AT, "name", "logCount"] as const;

describe("cursorSort helpers", () => {
  it("validates sortable keys and params", () => {
    expect(isSortableKey("name", KEYS)).toBe(true);
    expect(isSortableKey("unknown", KEYS)).toBe(false);
    expect(isSortParam("-logCount", KEYS)).toBe(true);
    expect(isSortParam("-unknown", KEYS)).toBe(false);
  });

  it("parses and builds sort params", () => {
    expect(parseSort(CREATED_AT_DESC)).toEqual({ field: CREATED_AT, dir: "DESC" });
    expect(parseSort("name")).toEqual({ field: "name", dir: "ASC" });
    expect(toSortParam("logCount", "DESC")).toBe("-logCount");
    expect(toSortParam("logCount", "ASC")).toBe("logCount");
  });

  it("clamps invalid params to fallback", () => {
    expect(clampSort(CREATED_AT_DESC, KEYS, "-name")).toBe(CREATED_AT_DESC);
    expect(clampSort("invalid", KEYS, "-name")).toBe("-name");
  });

  it("toggles next sort intelligently", () => {
    expect(nextSortForColumn(CREATED_AT_DESC, CREATED_AT)).toBe(CREATED_AT);
    expect(
      nextSortForColumn("name", "logCount", {
        descByDefault: ["logCount"],
      }),
    ).toBe("-logCount");
  });

  it("createCursorSort wires feature-specific helpers", () => {
    const metricSort = createCursorSort({
      keys: KEYS,
      defaultDesc: [CREATED_AT, "logCount"],
      defaultSort: CREATED_AT_DESC,
    });

    expect(metricSort.KEYS).toEqual(KEYS);
    expect(metricSort.DEFAULT_SORT).toBe(CREATED_AT_DESC);
    expect(metricSort.isKey("name")).toBe(true);
    expect(metricSort.toSortParam("name", "ASC")).toBe("name");
    expect(metricSort.nextSortForColumn(CREATED_AT_DESC, CREATED_AT)).toBe(CREATED_AT);

    const sp = new URLSearchParams({ sort: "-logCount" });
    expect(metricSort.sortFromSearchParams(sp)).toBe("-logCount");
    sp.set("sort", "invalid");
    expect(metricSort.sortFromSearchParams(sp)).toBe(CREATED_AT_DESC);
  });
});
