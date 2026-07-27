import { render, screen } from "@testing-library/react";

import EmptyDataIndicator from "@/components/ui/EmptyDataIndicator";

describe("EmptyDataIndicator", () => {
  it("renders default copy", () => {
    render(<EmptyDataIndicator />);

    expect(screen.getByRole("heading", { name: /no data available/i })).toBeInTheDocument();
    expect(screen.getByText(/no items found for this view/i)).toBeInTheDocument();
  });

  it("renders custom title/description and tooltip", () => {
    render(
      <EmptyDataIndicator
        title="No Metrics Yet"
        description="Create your first metric"
        tooltip="Tip: start with one core metric"
      />,
    );

    expect(screen.getByRole("heading", { name: /no metrics yet/i })).toBeInTheDocument();
    expect(screen.getByText(/create your first metric/i)).toBeInTheDocument();
    expect(screen.getByText(/tip: start with one core metric/i)).toBeInTheDocument();
  });

  it("does not render tooltip when not provided", () => {
    render(<EmptyDataIndicator title="Empty" description="None" />);

    expect(screen.queryByText(/tip:/i)).not.toBeInTheDocument();
  });
});
