import { cn } from "@/lib/cn";

const CAPTION = "text-caption";

describe("cn", () => {
  it("merges classnames and removes duplicates via tailwind-merge", () => {
    const result = cn("px-2", null, ["text-sm", { hidden: false }], "px-4", { hidden: true });
    expect(result).toBe("text-sm px-4 hidden");
  });

  it("handles conditional values gracefully", () => {
    expect(cn(undefined, false && "sr-only", "rounded")).toBe("rounded");
  });

  it("keeps a named font size next to a text colour", () => {
    expect(cn(CAPTION, "text-ink-secondary")).toBe(`${CAPTION} text-ink-secondary`);
    expect(cn("text-badge", "text-ink-tertiary")).toBe("text-badge text-ink-tertiary");
  });

  it("resolves conflicts between named and default font sizes", () => {
    expect(cn("text-body2", CAPTION)).toBe(CAPTION);
    expect(cn("text-sm", "text-h4")).toBe("text-h4");
  });
});
