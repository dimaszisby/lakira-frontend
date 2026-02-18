import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import type { MetricFormInitial } from "@/features/metrics";
import MetricForm from "@/features/metrics/components/MetricForm";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const metricId = "metric-1";

const existingMetric: MetricFormInitial = {
  id: metricId,
  name: "W",
  defaultUnit: "kg",
  description: "Old description",
  isPublic: false,
  originalMetricId: null,
};

function mockCategoryTypeahead() {
  return http.get("/api/proxy/metric-categories", () =>
    HttpResponse.json({
      status: "success",
      message: "ok",
      data: {
        items: [],
        sort: "-metricCount",
        limit: 15,
      },
    }),
  );
}

describe("MetricForm integration", () => {
  it("creates a metric and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createPayloadSpy = jest.fn();

    server.use(
      mockCategoryTypeahead(),
      http.post("/api/proxy/metrics", async ({ request }) => {
        const body = await request.json();
        createPayloadSpy(body);

        return HttpResponse.json({
          status: "success",
          message: "Metric created",
          data: {
            id: "metric-new",
            name: "A",
            description: "",
            defaultUnit: "kg",
            isPublic: false,
            userId: "user-1",
            categoryId: null,
            originalMetricId: null,
            createdAt: "2026-02-18",
            updatedAt: "2026-02-18",
          },
        });
      }),
    );

    renderWithProviders(<MetricForm initialMetric={null} onClose={onClose} />);

    await user.type(screen.getByLabelText(/metric name/i), "A");
    await user.type(screen.getByLabelText(/default unit/i), "kg");
    await user.click(screen.getByRole("button", { name: /save metric/i }));

    await waitFor(() => {
      expect(createPayloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "A",
          defaultUnit: "kg",
          categoryId: null,
          isPublic: false,
        }),
      );
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates an existing metric and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const updatePayloadSpy = jest.fn();

    server.use(
      mockCategoryTypeahead(),
      http.put("/api/proxy/metrics/:id", async ({ params, request }) => {
        const body = await request.json();
        updatePayloadSpy({
          id: params.id,
          body,
        });

        return HttpResponse.json({
          status: "success",
          message: "Metric updated",
          data: {
            id: metricId,
            name: "Q",
            description: "Old description",
            defaultUnit: "kg",
            isPublic: false,
            userId: "user-1",
            categoryId: null,
            originalMetricId: null,
            createdAt: "2026-02-18",
            updatedAt: "2026-02-18",
          },
        });
      }),
    );

    renderWithProviders(<MetricForm initialMetric={existingMetric} onClose={onClose} />);

    const metricNameInput = screen.getByLabelText(/metric name/i);
    await user.clear(metricNameInput);
    await user.type(metricNameInput, "Q");
    await user.click(screen.getByRole("button", { name: /save metric/i }));

    await waitFor(() => {
      expect(updatePayloadSpy).toHaveBeenCalledWith({
        id: metricId,
        body: expect.objectContaining({
          name: "Q",
          defaultUnit: "kg",
          categoryId: null,
        }),
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
        mockCategoryTypeahead(),
        http.post("/api/proxy/metrics", () =>
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

      renderWithProviders(<MetricForm initialMetric={null} onClose={onClose} />);

      await user.type(screen.getByLabelText(/metric name/i), "A");
      await user.type(screen.getByLabelText(/default unit/i), "kg");
      await user.click(screen.getByRole("button", { name: /save metric/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
