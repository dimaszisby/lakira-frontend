import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Pagination } from "@/components/ui/Pagination";

const GO_TO_PAGE_1_LABEL = /go to page 1$/i;
const NEXT_PAGE_LABEL = /next page/i;
const PREVIOUS_PAGE_LABEL = /previous page/i;
const ARIA_CURRENT_ATTR = "aria-current";
const ARIA_CURRENT_PAGE = "page";

describe("Pagination", () => {
  it("renders numbered pages with a known total and navigates", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={5} pageSize={10} total={100} onChange={onChange} />);

    const current = screen.getByRole("button", { name: /go to page 5/i });
    expect(current).toHaveAttribute(ARIA_CURRENT_ATTR, ARIA_CURRENT_PAGE);
    expect(current).toBeDisabled();
    expect(screen.getAllByText("...")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: NEXT_PAGE_LABEL }));
    await user.click(screen.getByRole("button", { name: /go to page 7/i }));

    expect(onChange).toHaveBeenNthCalledWith(1, 6);
    expect(onChange).toHaveBeenNthCalledWith(2, 7);
  });

  it("uses cursor-mode controls when the total is unknown", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={3} pageSize={10} onChange={onChange} canPrev={false} canNext />);

    expect(screen.getByRole("button", { name: PREVIOUS_PAGE_LABEL })).toBeDisabled();
    expect(screen.getByText("Page 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: NEXT_PAGE_LABEL }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("clamps an out-of-range page to the total", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={99} pageSize={10} total={25} onChange={onChange} />);

    expect(screen.getByRole("button", { name: /go to page 3/i })).toHaveAttribute(
      ARIA_CURRENT_ATTR,
      ARIA_CURRENT_PAGE,
    );
    expect(screen.getByRole("button", { name: NEXT_PAGE_LABEL })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: PREVIOUS_PAGE_LABEL }));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not trigger disabled controls", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={1} pageSize={10} total={50} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: PREVIOUS_PAGE_LABEL }));
    await user.click(screen.getByRole("button", { name: GO_TO_PAGE_1_LABEL }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps known-total boundaries disabled even when canPrev/canNext are true", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const { rerender } = render(
      <Pagination page={1} pageSize={10} total={20} canPrev canNext onChange={onChange} />,
    );

    expect(screen.getByRole("button", { name: PREVIOUS_PAGE_LABEL })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: NEXT_PAGE_LABEL }));
    expect(onChange).toHaveBeenCalledWith(2);

    onChange.mockClear();
    rerender(<Pagination page={2} pageSize={10} total={20} canPrev canNext onChange={onChange} />);

    const next = screen.getByRole("button", { name: NEXT_PAGE_LABEL });
    expect(next).toBeDisabled();
    await user.click(next);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("normalizes an invalid pageSize", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={1} pageSize={Number.NaN} total={25} onChange={onChange} />);

    expect(screen.getByRole("button", { name: GO_TO_PAGE_1_LABEL })).toHaveAttribute(
      ARIA_CURRENT_ATTR,
      ARIA_CURRENT_PAGE,
    );

    await user.click(screen.getByRole("button", { name: NEXT_PAGE_LABEL }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("labels the navigation landmark", () => {
    render(
      <Pagination
        page={1}
        pageSize={10}
        total={30}
        onChange={() => {}}
        aria-label="Metric pages"
      />,
    );

    expect(screen.getByRole("navigation", { name: "Metric pages" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Pagination page={5} pageSize={10} total={100} onChange={() => {}} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
