import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import MetricLogForm from "@/features/metric-logs/components/LogForm";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const metricId = "11111111-1111-4111-8111-111111111111";
const loggedAtIso = "2026-02-18T08:00:00.000Z";
const METRIC_LOGS_API = "/api/proxy/metric-logs";

const existingLog: MetricLogVM = {
  id: "log-1",
  metricId,
  logValue: 120,
  loggedAt: loggedAtIso,
  type: "manual",
  createdAt: loggedAtIso,
  updatedAt: loggedAtIso,
};

async function settleAsyncUpdates() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("MetricLogForm integration", () => {
  afterEach(async () => {
    await settleAsyncUpdates();
  });

  it("creates a metric log and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createPayloadSpy = jest.fn();

    server.use(
      http.post(METRIC_LOGS_API, async ({ request }) => {
        const body = await request.json();
        createPayloadSpy(body);

        return HttpResponse.json({
          status: "success",
          message: "Log created",
          data: {
            ...existingLog,
            id: "log-new",
            logValue: Number((body as { logValue?: number }).logValue ?? 0),
            loggedAt: String((body as { loggedAt?: string }).loggedAt ?? existingLog.loggedAt),
          },
        });
      }),
    );

    renderWithProviders(<MetricLogForm metricId={metricId} onClose={onClose} />);

    const logValueInput = screen.getByLabelText(/log value/i);
    await user.clear(logValueInput);
    await user.type(logValueInput, "150");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(createPayloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricId,
          logValue: 150,
          type: "manual",
        }),
      );
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates an existing metric log and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const updatePayloadSpy = jest.fn();

    server.use(
      http.put(`${METRIC_LOGS_API}/:id`, async ({ params, request }) => {
        const body = await request.json();
        updatePayloadSpy({
          id: params.id,
          body,
        });

        return HttpResponse.json({
          status: "success",
          message: "Log updated",
          data: {
            ...existingLog,
            logValue: Number((body as { logValue?: number }).logValue ?? existingLog.logValue),
          },
        });
      }),
    );

    renderWithProviders(
      <MetricLogForm metricId={metricId} initialLog={existingLog} onClose={onClose} />,
    );

    const logValueInput = screen.getByLabelText(/log value/i);
    await user.clear(logValueInput);
    await user.type(logValueInput, "200");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updatePayloadSpy).toHaveBeenCalledWith({
        id: existingLog.id,
        body: expect.objectContaining({
          metricId,
          logValue: 200,
          type: "manual",
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
        http.put(`${METRIC_LOGS_API}/:id`, () =>
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

      renderWithProviders(
        <MetricLogForm metricId={metricId} initialLog={existingLog} onClose={onClose} />,
      );

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("deletes an existing metric log and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const deletePayloadSpy = jest.fn();

    server.use(
      http.delete(`${METRIC_LOGS_API}/:id`, async ({ params, request }) => {
        const requestUrl = new URL(request.url);
        deletePayloadSpy({
          id: params.id,
          metricIdFromQuery: requestUrl.searchParams.get("metricId"),
        });

        return HttpResponse.json({
          status: "success",
          message: "Log deleted",
          data: existingLog,
        });
      }),
    );

    renderWithProviders(
      <MetricLogForm metricId={metricId} initialLog={existingLog} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: /^delete log$/i }));

    await waitFor(() => {
      expect(deletePayloadSpy).toHaveBeenCalledWith({
        id: existingLog.id,
        metricIdFromQuery: null,
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
        http.post(METRIC_LOGS_API, () =>
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

      renderWithProviders(<MetricLogForm metricId={metricId} onClose={onClose} />);

      const logValueInput = screen.getByLabelText(/log value/i);
      await user.clear(logValueInput);
      await user.type(logValueInput, "90");
      await user.click(screen.getByRole("button", { name: /^add$/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("has no critical accessibility violations on initial render", async () => {
    const { container } = renderWithProviders(<MetricLogForm metricId={metricId} onClose={jest.fn()} />);
    await settleAsyncUpdates();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("shows metric-id guard message and does not render form controls when metricId is empty", () => {
    renderWithProviders(<MetricLogForm metricId="" onClose={jest.fn()} />);

    expect(screen.getByText(/metric id is required to add a log/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^add$/i })).not.toBeInTheDocument();
  });

  it("stays open when delete fails", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.delete(`${METRIC_LOGS_API}/:id`, () =>
          HttpResponse.json(
            {
              status: "error",
              message: "Delete failed",
              data: null,
            },
            { status: 500 },
          ),
        ),
      );

      renderWithProviders(
        <MetricLogForm metricId={metricId} initialLog={existingLog} onClose={onClose} />,
      );

      await user.click(screen.getByRole("button", { name: /^delete log$/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(/request failed with status code 500/i);
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("resets displayed defaults when initialLog prop changes", async () => {
    const onClose = jest.fn();
    const { rerender } = renderWithProviders(
      <MetricLogForm metricId={metricId} initialLog={existingLog} onClose={onClose} />,
    );

    const nextLog: MetricLogVM = {
      ...existingLog,
      id: "log-2",
      logValue: 315,
      loggedAt: "2026-02-19T11:00:00.000Z",
      updatedAt: "2026-02-19T11:00:00.000Z",
    };

    rerender(<MetricLogForm metricId={metricId} initialLog={nextLog} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/log value/i)).toHaveValue(315);
    });
  });
});
