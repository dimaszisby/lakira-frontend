import { render, screen } from "@testing-library/react";

import { MetricCategoryTableBase } from "@/features/metric-categories/components/MetricCategoryTable";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";

const desktopSpy = jest.fn();
const mobileSpy = jest.fn();

jest.mock("@/features/metric-categories/components/MetricCategoryDesktopTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    desktopSpy(props);
    return <div data-testid="desktop-table" />;
  },
}));

jest.mock("@/features/metric-categories/components/MetricCategoryMobileTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mobileSpy(props);
    return <div data-testid="mobile-table" />;
  },
}));

const categories: MetricCategoryVM[] = [
  { id: "cat-1", name: "Wellness", color: "#FF0000", icon: "🔥", metricCount: 5 },
];

describe("MetricCategoryTable", () => {
  beforeEach(() => {
    desktopSpy.mockClear();
    mobileSpy.mockClear();
  });

  it("renders both desktop and mobile table variants", () => {
    render(
      <MetricCategoryTableBase categories={categories} sortBy="name" sortOrder="ASC" onSort={() => {}} />,
    );

    expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-table")).toBeInTheDocument();
  });

  it("passes shared data and sorting props to both variants", () => {
    const onSort = jest.fn();

    render(
      <MetricCategoryTableBase
        categories={categories}
        sortBy="createdAt"
        sortOrder="DESC"
        onSort={onSort}
      />,
    );

    expect(desktopSpy).toHaveBeenCalled();
    expect(mobileSpy).toHaveBeenCalled();

    const desktopProps = desktopSpy.mock.calls[0]?.[0] as {
      categories: MetricCategoryVM[];
      sortBy: keyof MetricCategoryVM;
      sortOrder: "ASC" | "DESC" | null;
      onSort: (column: keyof MetricCategoryVM) => void;
    };
    const mobileProps = mobileSpy.mock.calls[0]?.[0] as typeof desktopProps;

    expect(desktopProps.categories).toEqual(categories);
    expect(desktopProps.sortBy).toBe("createdAt");
    expect(desktopProps.sortOrder).toBe("DESC");
    expect(desktopProps.onSort).toBe(onSort);
    expect(mobileProps.categories).toEqual(categories);
    expect(mobileProps.onSort).toBe(onSort);
  });

  it("forwards row and action callbacks to both variants", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onRowClick = jest.fn();

    render(
      <MetricCategoryTableBase
        categories={categories}
        sortBy="name"
        sortOrder="ASC"
        onSort={() => {}}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
      />,
    );

    const desktopProps = desktopSpy.mock.calls[0]?.[0] as {
      onEdit?: (category: MetricCategoryVM) => void;
      onDelete?: (category: MetricCategoryVM) => void;
      onRowClick?: (category: MetricCategoryVM) => void;
    };
    const mobileProps = mobileSpy.mock.calls[0]?.[0] as typeof desktopProps;

    expect(desktopProps.onEdit).toBe(onEdit);
    expect(desktopProps.onDelete).toBe(onDelete);
    expect(desktopProps.onRowClick).toBe(onRowClick);
    expect(mobileProps.onEdit).toBe(onEdit);
    expect(mobileProps.onDelete).toBe(onDelete);
    expect(mobileProps.onRowClick).toBe(onRowClick);
  });
});
