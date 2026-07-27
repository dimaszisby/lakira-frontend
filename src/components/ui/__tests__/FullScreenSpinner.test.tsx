import { render, screen } from "@testing-library/react";

import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";

describe("FullScreenSpinner", () => {
  it("renders status semantics and default label", () => {
    render(<FullScreenSpinner />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<FullScreenSpinner label="Checking session" />);

    expect(screen.getByText("Checking session")).toBeInTheDocument();
  });
});
