import { cn } from "@/lib/cn";

describe("cn", () => {
  it("merges classnames and removes duplicates via tailwind-merge", () => {
    const result = cn("px-2", null, ["text-sm", { hidden: false }], "px-4", { hidden: true });
    expect(result).toBe("text-sm px-4 hidden");
  });

  it("handles conditional values gracefully", () => {
    expect(cn(undefined, false && "sr-only", "rounded")).toBe("rounded");
  });
});
