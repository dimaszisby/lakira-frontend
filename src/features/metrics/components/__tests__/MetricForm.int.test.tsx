import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import type { MetricFormInitial } from "@/features/metrics";
import MetricForm from "@/features/metrics/components/MetricForm";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const metricId = "metric-1";
const defaultUnit = "kg";
const fixedDate = "2026-02-18";
const fixedDateTime = "2026-02-18T00:00:00.000Z";
const metricsEndpoint = "/api/proxy/metrics";
const duplicateMetricName = "Dup Metric";

const existingMetric: MetricFormInitial = {
  id: metricId,
  name: "W",
  defaultUnit,
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

function mockDuplicateMetricLookup() {
  return http.get(metricsEndpoint, ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get("name")?.trim().toLowerCase();
    const isDuplicate = name === "dup metric";

    return HttpResponse.json({
      status: "success",
      message: "ok",
      data: {
        metrics: isDuplicate
          ? [
              {
                id: "metric-dup",
                name: duplicateMetricName,
                defaultUnit: "kg",
                description: null,
                isPublic: false,
                category: null,
                goalType: null,
                logCount: 0,
                createdAt: fixedDateTime,
                updatedAt: fixedDateTime,
              },
            ]
          : [],
        total: isDuplicate ? 1 : 0,
      },
    });
  });
}

async function settleAsyncUpdates() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
}

async function waitForCategoryTypeaheadIdle() {
  const categoryInput = await screen.findByRole("combobox");

  await waitFor(() => {
    expect(categoryInput).not.toHaveAttribute("aria-busy", "true");
  });
}

describe("MetricForm integration", () => {
  afterEach(async () => {
    await settleAsyncUpdates();
  });

  it("creates a metric and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createPayloadSpy = jest.fn();

    server.use(
      mockCategoryTypeahead(),
      http.post(metricsEndpoint, async ({ request }) => {
        const body = await request.json();
        createPayloadSpy(body);

        return HttpResponse.json({
          status: "success",
          message: "Metric created",
          data: {
            id: "metric-new",
            name: "A",
            description: "",
            defaultUnit,
            isPublic: false,
            userId: "user-1",
            categoryId: null,
            originalMetricId: null,
            createdAt: fixedDate,
            updatedAt: fixedDate,
          },
        });
      }),
    );

    renderWithProviders(<MetricForm initialMetric={null} onClose={onClose} />);
    await waitForCategoryTypeaheadIdle();

    await user.type(screen.getByLabelText(/metric name/i), "A");
    await user.type(screen.getByLabelText(/default unit/i), defaultUnit);
    await user.click(screen.getByRole("button", { name: /save metric/i }));

    await waitFor(() => {
      expect(createPayloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "A",
          defaultUnit,
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
      http.put(`${metricsEndpoint}/:id`, async ({ params, request }) => {
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
            defaultUnit,
            isPublic: false,
            userId: "user-1",
            categoryId: null,
            originalMetricId: null,
            createdAt: fixedDate,
            updatedAt: fixedDate,
          },
        });
      }),
    );

    renderWithProviders(<MetricForm initialMetric={existingMetric} onClose={onClose} />);
    await waitForCategoryTypeaheadIdle();

    const metricNameInput = screen.getByLabelText(/metric name/i);
    await user.clear(metricNameInput);
    await user.type(metricNameInput, "Q");
    await user.click(screen.getByRole("button", { name: /save metric/i }));

    await waitFor(() => {
      expect(updatePayloadSpy).toHaveBeenCalledWith({
        id: metricId,
        body: expect.objectContaining({
          name: "Q",
          defaultUnit,
          categoryId: null,
        }),
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error message and stays open when update fails", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        mockCategoryTypeahead(),
        http.put(`${metricsEndpoint}/:id`, () =>
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

      renderWithProviders(<MetricForm initialMetric={existingMetric} onClose={onClose} />);
      await waitForCategoryTypeaheadIdle();

      await user.click(screen.getByRole("button", { name: /save metric/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("deletes an existing metric and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const deletePayloadSpy = jest.fn();

    server.use(
      mockCategoryTypeahead(),
      http.delete(`${metricsEndpoint}/:id`, async ({ params }) => {
        deletePayloadSpy({
          id: params.id,
        });

        return HttpResponse.json({
          status: "success",
          message: "Metric deleted",
          data: {
            id: metricId,
            name: existingMetric.name,
            description: existingMetric.description,
            defaultUnit: existingMetric.defaultUnit,
            isPublic: existingMetric.isPublic,
            userId: "user-1",
            categoryId: null,
            originalMetricId: null,
            createdAt: fixedDate,
            updatedAt: fixedDate,
          },
        });
      }),
    );

    renderWithProviders(<MetricForm initialMetric={existingMetric} onClose={onClose} />);
    await waitForCategoryTypeaheadIdle();

    await user.click(screen.getByRole("button", { name: /delete metric/i }));

    await waitFor(() => {
      expect(deletePayloadSpy).toHaveBeenCalledWith({
        id: metricId,
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
        http.post(metricsEndpoint, () =>
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
      await waitForCategoryTypeaheadIdle();

      await user.type(screen.getByLabelText(/metric name/i), "A");
      await user.type(screen.getByLabelText(/default unit/i), defaultUnit);
      await user.click(screen.getByRole("button", { name: /save metric/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("shows an error message and stays open when delete fails", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        mockCategoryTypeahead(),
        http.delete(`${metricsEndpoint}/:id`, () =>
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

      renderWithProviders(<MetricForm initialMetric={existingMetric} onClose={onClose} />);
      await waitForCategoryTypeaheadIdle();

      await user.click(screen.getByRole("button", { name: /delete metric/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("shows duplicate-name validation and prevents submit", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createPayloadSpy = jest.fn();

    server.use(
      mockCategoryTypeahead(),
      mockDuplicateMetricLookup(),
      http.post(metricsEndpoint, async ({ request }) => {
        const body = await request.json();
        createPayloadSpy(body);
        return HttpResponse.json({
          status: "success",
          message: "Metric created",
          data: {
            id: "metric-new",
            name: duplicateMetricName,
            description: "",
            defaultUnit,
            isPublic: false,
            userId: "user-1",
            categoryId: null,
            originalMetricId: null,
            createdAt: fixedDate,
            updatedAt: fixedDate,
          },
        });
      }),
    );

    renderWithProviders(<MetricForm initialMetric={null} onClose={onClose} />);
    await waitForCategoryTypeaheadIdle();

    await user.type(screen.getByLabelText(/metric name/i), duplicateMetricName);
    await user.type(screen.getByLabelText(/default unit/i), defaultUnit);

    await waitFor(() => {
      expect(screen.getByText("Metric name already exists")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save metric/i });
    expect(saveButton).toBeDisabled();
    await user.click(saveButton);

    expect(createPayloadSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("has no critical accessibility violations on initial render", async () => {
    server.use(mockCategoryTypeahead());
    const { container } = renderWithProviders(<MetricForm initialMetric={null} onClose={jest.fn()} />);
    await waitForCategoryTypeaheadIdle();
    await settleAsyncUpdates();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("resets displayed defaults when initialMetric prop changes", async () => {
    server.use(mockCategoryTypeahead());
    const onClose = jest.fn();
    const { rerender } = renderWithProviders(
      <MetricForm initialMetric={existingMetric} onClose={onClose} />,
    );
    await waitForCategoryTypeaheadIdle();

    const nextMetric: MetricFormInitial = {
      id: "metric-2",
      name: "Z",
      defaultUnit: "minutes",
      description: "Updated description",
      isPublic: false,
      originalMetricId: null,
    };

    rerender(<MetricForm initialMetric={nextMetric} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/metric name/i)).toHaveValue("Z");
      expect(screen.getByLabelText(/default unit/i)).toHaveValue("minutes");
      expect(screen.getByLabelText(/description/i)).toHaveValue("Updated description");
    });
  });
});
