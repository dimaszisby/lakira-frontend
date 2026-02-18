import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http,HttpResponse } from "msw";

import MetricCategoryForm from "@/features/metric-categories/components/MetricCategoryForm";
import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const FIXED_TIMESTAMP = "2026-02-18T00:00:00.000Z";

const existingCategory: MetricCategoryVM = {
  id: "cat-1",
  name: "Wellness",
  color: "#FF0000",
  icon: "🔥",
  metricCount: 5,
  createdAt: "2026-02-10T10:00:00.000Z",
  updatedAt: "2026-02-12T10:00:00.000Z",
};

describe("MetricCategoryForm integration", () => {
  it("creates a category and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createPayloadSpy = jest.fn();

    server.use(
      http.post("/api/proxy/metric-categories", async ({ request }) => {
        const body = await request.json();
        createPayloadSpy(body);

        return HttpResponse.json({
          status: "success",
          message: "Category created",
          data: {
            id: "cat-new",
            name: "Hydration",
            color: CATEGORY_DEFAULTS.color,
            icon: CATEGORY_DEFAULTS.icon,
            metricCount: 0,
            createdAt: FIXED_TIMESTAMP,
            updatedAt: FIXED_TIMESTAMP,
          },
        });
      }),
    );

    renderWithProviders(<MetricCategoryForm onClose={onClose} initialCategory={null} />);

    await user.type(screen.getByLabelText(/category name/i), "Hydration");
    await user.click(screen.getByRole("button", { name: /add category/i }));

    await waitFor(() => {
      expect(createPayloadSpy).toHaveBeenCalledWith({
        name: "Hydration",
        color: CATEGORY_DEFAULTS.color,
        icon: CATEGORY_DEFAULTS.icon,
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates an existing category and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const updatePayloadSpy = jest.fn();

    server.use(
      http.put("/api/proxy/metric-categories/:id", async ({ params, request }) => {
        const body = await request.json();
        updatePayloadSpy({
          id: params.id,
          body,
        });

        return HttpResponse.json({
          status: "success",
          message: "Category updated",
          data: {
            ...existingCategory,
            name: "Strength",
            updatedAt: FIXED_TIMESTAMP,
          },
        });
      }),
    );

    renderWithProviders(<MetricCategoryForm onClose={onClose} initialCategory={existingCategory} />);

    const nameInput = screen.getByLabelText(/category name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Strength");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updatePayloadSpy).toHaveBeenCalledWith({
        id: existingCategory.id,
        body: {
          name: "Strength",
          color: existingCategory.color,
          icon: existingCategory.icon,
        },
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error message and stays open when create fails", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.post("/api/proxy/metric-categories", () =>
          HttpResponse.json(
            {
              status: "error",
              message: "Internal server error",
              data: null,
            },
            { status: 500 },
          ),
        ),
      );

      renderWithProviders(<MetricCategoryForm onClose={onClose} initialCategory={null} />);

      await user.type(screen.getByLabelText(/category name/i), "Hydration");
      await user.click(screen.getByRole("button", { name: /add category/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
