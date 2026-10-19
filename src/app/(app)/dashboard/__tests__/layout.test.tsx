import { render, screen } from "@testing-library/react";

import DashboardLayout from "@/src/app/(app)/dashboard/layout";

describe("DashboardLayout", () => {
  it("renders the page's one h1 above its content", () => {
    render(
      <DashboardLayout>
        <p>Cards</p>
      </DashboardLayout>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Cards")).toBeInTheDocument();
  });
});
