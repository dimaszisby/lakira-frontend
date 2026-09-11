import { render, screen } from "@testing-library/react";

import { ErrorMessage } from "@/components/ui/ErrorMessage";

describe("ErrorMessage", () => {
  it("renders a sanitized message as an alert", () => {
    render(<ErrorMessage message={"<script>alert(1)</script>Invalid input"} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Invalid input");
    expect(alert).not.toHaveTextContent("<script>");
  });

  it("announces politely without the alert role when politeness is polite", () => {
    render(<ErrorMessage message="Email is required" politeness="polite" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Email is required").parentElement).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("renders nothing when empty and reserveSpace is false", () => {
    const { container } = render(<ErrorMessage reserveSpace={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps its space without announcing when empty and reserveSpace is true", () => {
    const { container } = render(<ErrorMessage />);

    expect(container.firstElementChild).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exposes variant and size to the recipe", () => {
    render(<ErrorMessage message="Failed" variant="subtle" size="sm" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-variant", "subtle");
    expect(alert).toHaveAttribute("data-size", "sm");
  });
});
