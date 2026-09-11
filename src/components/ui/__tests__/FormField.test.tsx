import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { FormField } from "@/components/ui/FormField";

const ARIA_DESCRIBEDBY = "aria-describedby";

describe("FormField", () => {
  it("wires the label and merges aria-describedby ids", () => {
    render(
      <FormField id="metric-name" description="Metric display name">
        <FormField.Label>Metric Name</FormField.Label>
        <FormField.Control>
          <input aria-describedby="external-help" />
        </FormField.Control>
      </FormField>,
    );

    const input = screen.getByRole("textbox", { name: /metric name/i });
    expect(input).toHaveAttribute("id", "metric-name");
    expect(input).toHaveAttribute(ARIA_DESCRIBEDBY, "external-help metric-name-desc");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and links the error message", () => {
    render(
      <FormField id="metric-value" error="Value is required">
        <FormField.Label>Metric Value</FormField.Label>
        <FormField.Control>
          <input />
        </FormField.Control>
      </FormField>,
    );

    const input = screen.getByRole("textbox", { name: /metric value/i });
    const errorId = "metric-value-err";

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(ARIA_DESCRIBEDBY, errorId);
    expect(input).toHaveAttribute("aria-errormessage", errorId);
    expect(document.getElementById(errorId)).toHaveTextContent("Value is required");
  });

  it("announces field errors politely rather than as an alert", () => {
    render(
      <FormField id="metric-unit" error="Unit is required">
        <FormField.Label>Metric Unit</FormField.Label>
        <FormField.Control>
          <input />
        </FormField.Control>
      </FormField>,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.getElementById("metric-unit-err")).toHaveAttribute("aria-live", "polite");
  });

  it("links both description and error ids when both are present", () => {
    render(
      <FormField id="metric-unit" description="Use SI units" error="Unit is required">
        <FormField.Label>Metric Unit</FormField.Label>
        <FormField.Control>
          <input />
        </FormField.Control>
      </FormField>,
    );

    const input = screen.getByRole("textbox", { name: /metric unit/i });
    expect(input).toHaveAttribute(ARIA_DESCRIBEDBY, "metric-unit-desc metric-unit-err");
  });

  it("has no axe violations when invalid", async () => {
    const { container } = render(
      <FormField id="email" description="Work email" error="Email is required">
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <input type="email" />
        </FormField.Control>
      </FormField>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
