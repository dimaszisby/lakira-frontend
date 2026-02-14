import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import SearchInput from "@/components/ui/SearchInput";

describe("SearchInput", () => {
  it("emits updated value through onChange", async () => {
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
          ariaLabel="Search metrics"
        />
      );
    };

    render(<Harness />);

    await user.type(screen.getByRole("searchbox", { name: /search metrics/i }), "abc");

    expect(onChange).toHaveBeenLastCalledWith("abc");
    expect(screen.getByRole("searchbox", { name: /search metrics/i })).toHaveValue("abc");
  });

  it("clears using onClear when provided", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onClear = jest.fn();

    render(
      <SearchInput value="metric" onChange={onChange} onClear={onClear} ariaLabel="Search metrics" />,
    );

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalledWith("");
  });

  it("falls back to onChange clear behavior when onClear is absent", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<SearchInput value="metric" onChange={onChange} ariaLabel="Search metrics" />);

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("supports Escape key to clear current value", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<SearchInput value="metric" onChange={onChange} ariaLabel="Search metrics" />);

    await user.type(screen.getByRole("searchbox", { name: /search metrics/i }), "{Escape}");

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("announces loading state", () => {
    render(<SearchInput value="" onChange={() => {}} isLoading ariaLabel="Search metrics" />);

    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });
});
