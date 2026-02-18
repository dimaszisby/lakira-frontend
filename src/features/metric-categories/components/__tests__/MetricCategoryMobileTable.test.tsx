import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MetricCategoryMobileTableBase } from "@/features/metric-categories/components/MetricCategoryMobileTable";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";

jest.mock("@/ui/SwipeableCard", () => ({
  __esModule: true,
  default: ({
    actions,
    children,
  }: {
    actions: { label: string; onClick: () => void }[];
    children: React.ReactNode;
  }) => (
    <div data-testid="swipeable-card">
      {actions.map((action) => (
        <button key={action.label} type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ))}
      {children}
    </div>
  ),
}));

jest.mock("@/features/metric-categories/components/MetricCategoryMobileCard", () => ({
  __esModule: true,
  default: ({
    category,
    onClick,
  }: {
    category: MetricCategoryVM;
    onClick?: (metric: MetricCategoryVM) => void;
  }) => (
    <button type="button" onClick={() => onClick?.(category)}>
      {category.name}
    </button>
  ),
}));

const categories: MetricCategoryVM[] = [
  { id: "cat-1", name: "Wellness", color: "#FF0000", icon: "🔥", metricCount: 5 },
  { id: "cat-2", name: "Hydration", color: "#00FF00", icon: "💧", metricCount: 2 },
];

describe("MetricCategoryMobileTable", () => {
  it("renders empty state when there are no categories", () => {
    render(
      <MetricCategoryMobileTableBase categories={[]} sortBy="name" sortOrder="ASC" onSort={() => {}} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No categories available");
  });

  it("renders categories and emits row click callback", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();

    render(
      <MetricCategoryMobileTableBase
        categories={categories}
        sortBy="name"
        sortOrder="ASC"
        onSort={() => {}}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Wellness" }));

    expect(onRowClick).toHaveBeenCalledWith(categories[0]);
    expect(screen.getAllByTestId("swipeable-card")).toHaveLength(2);
  });

  it("emits edit and delete actions for the corresponding category", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <MetricCategoryMobileTableBase
        categories={categories}
        sortBy="name"
        sortOrder="ASC"
        onSort={() => {}}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

    await user.click(editButtons[0] as HTMLButtonElement);
    await user.click(deleteButtons[0] as HTMLButtonElement);

    expect(onEdit).toHaveBeenCalledWith(categories[0]);
    expect(onDelete).toHaveBeenCalledWith(categories[0]);
  });
});
