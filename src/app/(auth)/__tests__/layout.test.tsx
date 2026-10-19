import { render, screen } from "@testing-library/react";

import AuthSegmentLayout from "../layout";

jest.mock("@/src/components/layout/Header", () => ({
  __esModule: true,
  default: () => null,
}));

describe("AuthSegmentLayout", () => {
  it("renders its pages in a main that script can focus and Tab skips", () => {
    render(
      <AuthSegmentLayout>
        <p>Login form</p>
      </AuthSegmentLayout>,
    );

    // RouteErrorPanel moves focus here after a successful retry.
    expect(screen.getByRole("main")).toHaveTextContent("Login form");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });
});
