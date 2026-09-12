import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";

import { SearchInput } from "@/components/ui/SearchInput";

const SEARCH_NAME = /search metrics/i;

describe("SearchInput", () => {
  it("emits the updated value through onChange", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const Harness = () => {
      const [value, setValue] = useState("");
      return (
        <SearchInput
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
          aria-label="Search metrics"
        />
      );
    };

    render(<Harness />);

    await user.type(screen.getByRole("searchbox", { name: SEARCH_NAME }), "abc");

    expect(onChange).toHaveBeenLastCalledWith("abc");
    expect(screen.getByRole("searchbox", { name: SEARCH_NAME })).toHaveValue("abc");
  });

  it("uses a default accessible name", () => {
    render(<SearchInput value="" onChange={() => {}} />);

    expect(screen.getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
  });

  it("clears through onClear when provided", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onClear = jest.fn();

    render(
      <SearchInput
        value="metric"
        onChange={onChange}
        onClear={onClear}
        aria-label="Search metrics"
      />,
    );

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalledWith("");
  });

  it("falls back to onChange('') when onClear is absent", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<SearchInput value="metric" onChange={onChange} aria-label="Search metrics" />);

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("returns focus to the input after clearing", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [value, setValue] = useState("metric");
      return <SearchInput value={value} onChange={setValue} aria-label="Search metrics" />;
    };

    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(screen.getByRole("searchbox", { name: SEARCH_NAME })).toHaveFocus();
  });

  it("clears on Escape", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<SearchInput value="metric" onChange={onChange} aria-label="Search metrics" />);

    await user.type(screen.getByRole("searchbox", { name: SEARCH_NAME }), "{Escape}");

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not clear on Escape during IME composition", () => {
    const onChange = jest.fn();

    render(<SearchInput value="metric" onChange={onChange} aria-label="Search metrics" />);

    fireEvent.keyDown(screen.getByRole("searchbox", { name: SEARCH_NAME }), {
      key: "Escape",
      isComposing: true,
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not clear on Escape when disabled", () => {
    const onChange = jest.fn();

    render(<SearchInput value="metric" onChange={onChange} aria-label="Search metrics" disabled />);

    fireEvent.keyDown(screen.getByRole("searchbox", { name: SEARCH_NAME }), { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("announces the loading state", () => {
    render(<SearchInput value="" onChange={() => {}} isLoading aria-label="Search metrics" />);

    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: SEARCH_NAME })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("forwards ref as a prop", () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchInput ref={ref} value="" onChange={() => {}} />);

    expect(ref.current).toBe(screen.getByRole("searchbox"));
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <SearchInput value="metric" onChange={() => {}} isLoading aria-label="Search metrics" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
