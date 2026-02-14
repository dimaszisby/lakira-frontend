import { render, screen } from "@testing-library/react";

import { FormField } from "@/components/ui/FormField";

const ARIA_DESCRIBEDBY = "aria-describedby";

describe("FormField", () => {
  it("wires label and merges aria-describedby ids", () => {
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

  it("marks control invalid when error is present and links error message", () => {
    render(
      <FormField id="metric-value" error="Value is required">
        <FormField.Label>Metric Value</FormField.Label>
        <FormField.Control>
          <input />
        </FormField.Control>
      </FormField>,
    );

    const input = screen.getByRole("textbox", { name: /metric value/i });
    const error = screen.getByText("Value is required");
    const metricValueErrId = "metric-value-err";

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(ARIA_DESCRIBEDBY, metricValueErrId);
    expect(input).toHaveAttribute("aria-errormessage", metricValueErrId);
    expect(error).toHaveAttribute("id", metricValueErrId);
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
});
