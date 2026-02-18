import { render, screen } from "@testing-library/react";

import ErrorMessage from "@/components/ui/ErrorMessage";

describe("ErrorMessage", () => {
  it("renders sanitized message and alert semantics", () => {
    render(<ErrorMessage message={'<script>alert(1)</script>Invalid input'} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Invalid input");
    expect(alert).not.toHaveTextContent("<script>");
  });

  it("uses fieldError message fallback", () => {
    render(<ErrorMessage fieldError={{ message: "Email is required" } as never} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });

  it("returns null when empty and reserveSpace is false", () => {
    const { container } = render(<ErrorMessage reserveSpace={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps layout space without alert role when empty and reserveSpace is true", () => {
    render(<ErrorMessage reserveSpace />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
