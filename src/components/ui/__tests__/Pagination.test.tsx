import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Pagination } from "@/components/ui/Pagination";

describe("Pagination", () => {
  it("renders known-total pagination and triggers navigation actions", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={5} pageSize={10} total={100} onChange={onChange} />);

    expect(screen.getByRole("button", { name: /go to page 5/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: /go to page 5/i })).toBeDisabled();
    expect(screen.getAllByText("...")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /next page/i }));
    await user.click(screen.getByRole("button", { name: /go to page 7/i }));

    expect(onChange).toHaveBeenNthCalledWith(1, 6);
    expect(onChange).toHaveBeenNthCalledWith(2, 7);
  });

  it("uses cursor-mode controls when total is unknown", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={3} pageSize={10} onChange={onChange} canPrev={false} canNext />);

    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
    expect(screen.getByText("Page 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next page/i }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("clamps out-of-range page to total bounds", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={99} pageSize={10} total={25} onChange={onChange} />);

    expect(screen.getByRole("button", { name: /go to page 3/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /previous page/i }));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not trigger disabled controls", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Pagination page={1} pageSize={10} total={50} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /previous page/i }));
    await user.click(screen.getByRole("button", { name: /go to page 1/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps known-total boundary controls disabled even when canPrev/canNext are true", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const { rerender } = render(
      <Pagination
        page={1}
        pageSize={10}
        total={20}
        canPrev
        canNext
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /next page/i }));
    expect(onChange).toHaveBeenCalledWith(2);

    onChange.mockClear();

    rerender(
      <Pagination
        page={2}
        pageSize={10}
        total={20}
        canPrev
        canNext
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /next page/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
