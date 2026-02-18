import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import MetricLogForm from "@/features/metric-logs/components/LogForm";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const metricId = "11111111-1111-4111-8111-111111111111";
const loggedAtIso = "2026-02-18T08:00:00.000Z";

const existingLog: MetricLogVM = {
  id: "log-1",
  metricId,
  logValue: 120,
  loggedAt: loggedAtIso,
  type: "manual",
  createdAt: loggedAtIso,
  updatedAt: loggedAtIso,
};

describe("MetricLogForm integration", () => {
  it("creates a metric log and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createPayloadSpy = jest.fn();

    server.use(
      http.post("/api/proxy/metric-logs", async ({ request }) => {
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
      http.put("/api/proxy/metric-logs/:id", async ({ params, request }) => {
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

  it("shows an error message and stays open when create fails", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.post("/api/proxy/metric-logs", () =>
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
});
