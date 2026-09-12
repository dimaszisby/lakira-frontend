import { render, screen } from "@testing-library/react";

import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";

describe("FullScreenSpinner", () => {
  it("announces a busy status with the default label", () => {
    render(<FullScreenSpinner />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading...");
  });

  it("renders a custom label", () => {
    render(<FullScreenSpinner label="Checking session" />);

    expect(screen.getByRole("status")).toHaveTextContent("Checking session");
  });
});
