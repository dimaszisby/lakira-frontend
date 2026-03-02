import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MetricCategoryForm from "@/features/metric-categories/components/MetricCategoryForm";
import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import {
  useCreateMetricCategory,
  useDeleteMetricCategory,
  useUpdateMetricCategory,
} from "@/features/metric-categories/hooks";

jest.mock("@/features/metric-categories/hooks", () => ({
  useCreateMetricCategory: jest.fn(),
  useUpdateMetricCategory: jest.fn(),
  useDeleteMetricCategory: jest.fn(),
}));

const mockCreateMetricCategory = jest.fn();
const mockUpdateMetricCategory = jest.fn();
const mockDeleteMetricCategory = jest.fn();

const mockUseCreateMetricCategory = useCreateMetricCategory as jest.Mock;
const mockUseUpdateMetricCategory = useUpdateMetricCategory as jest.Mock;
const mockUseDeleteMetricCategory = useDeleteMetricCategory as jest.Mock;

const existingCategory = {
  id: "cat-1",
  name: "Wellness",
  color: "#FF0000",
  icon: "🔥",
  metricCount: 5,
  createdAt: "2026-02-10T10:00:00.000Z",
  updatedAt: "2026-02-12T10:00:00.000Z",
};

const setupHooks = (options?: {
  createError?: Error | null;
  updateError?: Error | null;
  deleteError?: Error | null;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}) => {
  mockUseCreateMetricCategory.mockReturnValue({
    createMetricCategory: mockCreateMetricCategory,
    isPending: options?.isCreating ?? false,
    error: options?.createError ?? null,
  });
  mockUseUpdateMetricCategory.mockReturnValue({
    updateMetricCategory: mockUpdateMetricCategory,
    isPending: options?.isUpdating ?? false,
    error: options?.updateError ?? null,
  });
  mockUseDeleteMetricCategory.mockReturnValue({
    deleteMetricCategory: mockDeleteMetricCategory,
    isPending: options?.isDeleting ?? false,
    error: options?.deleteError ?? null,
  });
};

describe("MetricCategoryForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMetricCategory.mockResolvedValue(undefined);
    mockUpdateMetricCategory.mockResolvedValue(undefined);
    mockDeleteMetricCategory.mockResolvedValue(undefined);
    setupHooks();
  });

  it("creates a category in create mode and closes on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<MetricCategoryForm onClose={onClose} initialCategory={null} />);

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, "Hydration");

    await user.click(screen.getByRole("button", { name: /add category/i }));

    await waitFor(() => {
      expect(mockCreateMetricCategory).toHaveBeenCalledWith({
        name: "Hydration",
        color: CATEGORY_DEFAULTS.color,
        icon: CATEGORY_DEFAULTS.icon,
      });
    });
    expect(mockUpdateMetricCategory).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("updates an existing category in edit mode", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<MetricCategoryForm onClose={onClose} initialCategory={existingCategory} />);

    const nameInput = screen.getByLabelText(/category name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Strength");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(mockUpdateMetricCategory).toHaveBeenCalledWith({
        categoryId: existingCategory.id,
        category: {
          name: "Strength",
          color: existingCategory.color,
          icon: existingCategory.icon,
        },
      });
    });
    expect(mockCreateMetricCategory).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deletes category in edit mode and closes on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<MetricCategoryForm onClose={onClose} initialCategory={existingCategory} />);

    await user.click(screen.getByRole("button", { name: /delete category/i }));

    await waitFor(() => {
      expect(mockDeleteMetricCategory).toHaveBeenCalledWith(existingCategory.id);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows hook mutation errors in the error banner", () => {
    setupHooks({ createError: new Error("Create category failed") });

    render(<MetricCategoryForm onClose={() => {}} initialCategory={null} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Create category failed");
  });

  it("calls onClose and resets field values when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<MetricCategoryForm onClose={onClose} initialCategory={null} />);

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, "Temporary Name");
    expect(nameInput).toHaveValue("Temporary Name");

    await user.click(screen.getByRole("button", { name: /close modal/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(nameInput).toHaveValue("");
  });

  it("resets form defaults when initialCategory prop changes", async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <MetricCategoryForm onClose={onClose} initialCategory={existingCategory} />,
    );

    const nextCategory = {
      ...existingCategory,
      id: "cat-2",
      name: "Mobility",
      color: "#00AAFF",
      icon: "🧘",
    };

    rerender(<MetricCategoryForm onClose={onClose} initialCategory={nextCategory} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/category name/i)).toHaveValue("Mobility");
      expect(screen.getByLabelText(/icon/i)).toHaveValue("🧘");
    });
  });

  it("does not close modal when delete fails", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    mockDeleteMetricCategory.mockRejectedValueOnce(new Error("Delete failed"));

    render(<MetricCategoryForm onClose={onClose} initialCategory={existingCategory} />);

    await user.click(screen.getByRole("button", { name: /delete category/i }));

    await waitFor(() => {
      expect(mockDeleteMetricCategory).toHaveBeenCalledWith(existingCategory.id);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
