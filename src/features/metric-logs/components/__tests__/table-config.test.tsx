import { mobileColumns } from "@/features/metric-logs/components/table-config";

describe("metric-logs table-config", () => {
  it("exports mobile columns with expected keys, labels, and sortability", () => {
    expect(mobileColumns).toHaveLength(2);
    expect(mobileColumns.map((column) => column.key)).toEqual(["loggedAt", "logValue"]);
    expect(mobileColumns.map((column) => column.label)).toEqual(["Logged At", "Log Value"]);
    expect(mobileColumns.every((column) => column.sortable)).toBe(true);
  });
});
