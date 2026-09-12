import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { EmptyDataIndicator } from "@/components/ui/EmptyDataIndicator";

describe("EmptyDataIndicator", () => {
  it("renders the default copy as a level-2 heading", () => {
    render(<EmptyDataIndicator />);

    expect(
      screen.getByRole("heading", { level: 2, name: /no data available/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no items found for this view/i)).toBeInTheDocument();
  });

  it("renders custom copy, tooltip and heading level", () => {
    render(
      <EmptyDataIndicator
        title="No Metrics Yet"
        description="Create your first metric"
        tooltip="Tip: start with one core metric"
        titleAs="h3"
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: /no metrics yet/i })).toBeInTheDocument();
    expect(screen.getByText(/create your first metric/i)).toBeInTheDocument();
    expect(screen.getByText(/tip: start with one core metric/i)).toBeInTheDocument();
  });

  it("omits the tooltip when none is provided", () => {
    render(<EmptyDataIndicator title="Empty" description="None" />);

    expect(screen.queryByText(/tip:/i)).not.toBeInTheDocument();
  });

  it("renders an action when provided", () => {
    render(<EmptyDataIndicator action={<button type="button">Create metric</button>} />);

    expect(screen.getByRole("button", { name: /create metric/i })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<EmptyDataIndicator tooltip="Tip" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
