import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";

import CategorySelect from "@/components/ui/CategorySelect";
import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";

const mockUseCategoryTypeahead = jest.fn();
const mockCreateMetricCategory = jest.fn();

jest.mock("@/features/metric-categories/useCategoryTypehead", () => ({
  useCategoryTypeahead: (...args: unknown[]) => mockUseCategoryTypeahead(...args),
}));

jest.mock("@/features/metric-categories/hooks", () => ({
  useCreateMetricCategory: () => ({
    createMetricCategory: mockCreateMetricCategory,
    isPending: false,
  }),
}));

jest.mock("@ariakit/react", () => {
  const ReactRuntime = require("react") as typeof React;

  type MockComboboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
    store?: unknown;
  };

  type MockComboboxListProps = React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
  };

  type MockComboboxPopoverProps = React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
    sameWidth?: boolean;
    gutter?: number;
    store?: unknown;
  };

  type MockComboboxItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    setValueOnClick?: boolean;
  };

  const MockCombobox = ReactRuntime.forwardRef<HTMLInputElement, MockComboboxProps>(
    (props, ref) => {
      const { store: _store, ...rest } = props;
      return <input ref={ref} {...rest} />;
    },
  );
  MockCombobox.displayName = "MockCombobox";

  const MockComboboxList = ReactRuntime.forwardRef<HTMLDivElement, MockComboboxListProps>(
    ({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    ),
  );
  MockComboboxList.displayName = "MockComboboxList";

  return {
    __esModule: true,
    useComboboxStore: ({
      value,
      setValue,
      open,
      setOpen,
    }: {
      value: string;
      setValue: (next: string) => void;
      open: boolean;
      setOpen: (next: boolean) => void;
    }) => ({ value, setValue, open, setOpen }),
    Combobox: MockCombobox,
    ComboboxPopover: ({ children, ...props }: MockComboboxPopoverProps) => {
      const { sameWidth: _sameWidth, gutter: _gutter, store: _store, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    ComboboxList: MockComboboxList,
    ComboboxItem: ({ children, ...props }: MockComboboxItemProps) => {
      const { setValueOnClick: _setValueOnClick, ...rest } = props;
      return (
        <button type="button" {...rest}>
          {children}
        </button>
      );
    },
  };
});

describe("CategorySelect", () => {
  beforeEach(() => {
    mockUseCategoryTypeahead.mockReset();
    mockCreateMetricCategory.mockReset();
    mockUseCategoryTypeahead.mockReturnValue({
      items: [],
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });
  });

  it("clears selected category", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    mockUseCategoryTypeahead.mockReturnValue({
      items: [{ id: "cat-1", name: "Health", color: "#FFFFFF", icon: "📁", metricCount: 3 }],
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    render(<CategorySelect catId="cat-1" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /clear selected category/i }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("chooses an option from list", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    mockUseCategoryTypeahead.mockReturnValue({
      items: [{ id: "cat-2", name: "Fitness", color: "#FFFFFF", icon: "📁", metricCount: 8 }],
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    render(<CategorySelect catId={null} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /fitness/i }));

    expect(onChange).toHaveBeenCalledWith("cat-2");
  });

  it("creates a category with shared defaults", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    mockCreateMetricCategory.mockResolvedValue({ id: "created-1" });

    render(<CategorySelect catId={null} onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "Growth");
    await user.click(screen.getByRole("button", { name: 'Create "Growth"' }));

    await waitFor(() => {
      expect(mockCreateMetricCategory).toHaveBeenCalledWith({
        name: "Growth",
        color: CATEGORY_DEFAULTS.color,
        icon: CATEGORY_DEFAULTS.icon,
      });
    });

    expect(onChange).toHaveBeenCalledWith("created-1");
  });

  it("marks combobox busy while loading", () => {
    mockUseCategoryTypeahead.mockReturnValue({
      items: [],
      isLoading: true,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    render(<CategorySelect catId={null} onChange={() => {}} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("aria-busy", "true");
  });
});
