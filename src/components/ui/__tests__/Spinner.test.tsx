import { render } from "@testing-library/react";

import { Spinner } from "@/components/ui/Spinner";

describe("Spinner", () => {
  it("is hidden from assistive technology", () => {
    const { container } = render(<Spinner />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the requested size to the recipe", () => {
    const { container } = render(<Spinner size="lg" />);

    expect(container.firstElementChild).toHaveAttribute("data-size", "lg");
  });
});
