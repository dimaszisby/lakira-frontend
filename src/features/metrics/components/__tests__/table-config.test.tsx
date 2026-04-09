import { render, screen } from "@testing-library/react";

import { desktopColumns, mobileColumns } from "@/features/metrics/components/table-config";
import type { MetricPreviewVM } from "@/features/metrics/view-models";

const baseMetric: MetricPreviewVM = {
  id: "metric-1",
  name: "Body Weight",
  defaultUnit: "kg",
  description: "Track body weight",
  isPublic: true,
  category: {
    id: "cat-1",
    name: "Fitness",
    color: "#22AA66",
    icon: "💪",
  },
  logCount: 12,
  createdAt: "2026-01-10T02:30:00.000Z",
  updatedAt: "2026-01-10T02:30:00.000Z",
};

describe("metrics table-config", () => {
  it("exports mobile column metadata with expected sortability", () => {
    expect(mobileColumns).toHaveLength(6);
    expect(mobileColumns.map((column) => column.key)).toEqual([
      "category",
      "name",
      "description",
      "defaultUnit",
      "isPublic",
      "logCount",
    ]);
    expect(mobileColumns.map((column) => column.sortable)).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  it("exports desktop sortable flags aligned with configured sort keys", () => {
    const byKey = new Map(desktopColumns.map((column) => [String(column.key), column]));

    expect(byKey.get("category")?.sortable).toBe(false);
    expect(byKey.get("name")?.sortable).toBe(true);
    expect(byKey.get("description")?.sortable).toBe(false);
    expect(byKey.get("defaultUnit")?.sortable).toBe(false);
    expect(byKey.get("isPublic")?.sortable).toBe(false);
    expect(byKey.get("logCount")?.sortable).toBe(true);
  });

  it("renders desktop description fallback and visibility/category cells", () => {
    const descriptionColumn = desktopColumns.find((column) => column.key === "description");
    const visibilityColumn = desktopColumns.find((column) => column.key === "isPublic");
    const categoryColumn = desktopColumns.find((column) => column.key === "category");

    expect(descriptionColumn?.renderCell).toBeDefined();
    expect(visibilityColumn?.renderCell).toBeDefined();
    expect(categoryColumn?.renderCell).toBeDefined();

    const noDescription = {
      ...baseMetric,
      description: null,
    };

    const { rerender } = render(
      <table>
        <tbody>
          <tr>
            <td>{descriptionColumn?.renderCell?.(noDescription, noDescription.description)}</td>
            <td>{visibilityColumn?.renderCell?.(baseMetric, baseMetric.isPublic)}</td>
            <td>{categoryColumn?.renderCell?.(baseMetric, baseMetric.category)}</td>
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText("No Description")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByLabelText("Category Fitness")).toBeInTheDocument();

    const privateMetric = { ...baseMetric, isPublic: false };
    rerender(
      <table>
        <tbody>
          <tr>
            <td>{visibilityColumn?.renderCell?.(privateMetric, privateMetric.isPublic)}</td>
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText("Private")).toBeInTheDocument();
  });
});
