import { render, screen } from "@testing-library/react";

import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

describe("SkeletonLoader", () => {
  it("announces loading and renders three placeholders by default", () => {
    render(<SkeletonLoader />);

    const status = screen.getByRole("status", { name: /loading content/i });
    expect(status.querySelectorAll("[aria-hidden='true']")).toHaveLength(3);
  });

  it("renders the requested number of placeholders with the item class", () => {
    render(<SkeletonLoader count={5} itemClassName="h-10" label="Loading metrics" />);

    const status = screen.getByRole("status", { name: /loading metrics/i });
    const items = status.querySelectorAll("[aria-hidden='true']");
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveClass("h-10");
  });
});
