import { render, screen } from "@testing-library/react";

import SkeletonLoader from "@/components/ui/SkeletonLoader";

describe("SkeletonLoader", () => {
  it("renders default count and loading status", () => {
    const { container } = render(<SkeletonLoader />);

    expect(screen.getByRole("status", { name: /loading content/i })).toBeInTheDocument();
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(3);
  });

  it("renders custom count and className", () => {
    const { container } = render(<SkeletonLoader count={5} className="h-10" />);

    const blocks = container.querySelectorAll("[aria-hidden='true']");
    expect(blocks).toHaveLength(5);
    expect(blocks[0]).toHaveClass("h-10");
  });
});
