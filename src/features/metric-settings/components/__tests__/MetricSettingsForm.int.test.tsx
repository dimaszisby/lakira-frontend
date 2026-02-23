import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http,HttpResponse } from "msw";

import MetricSettingsForm from "@/features/metric-settings/components/MetricSettingsForm";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const metricId = "11111111-1111-4111-8111-111111111111";
const settingsId = "22222222-2222-4222-8222-222222222222";
const fixedTimestamp = "2026-02-18T08:00:00.000Z";

const existingSettings: MetricSettingsExtendedVM = {
  id: settingsId,
  metricId,
  isActive: true,
  goalEnabled: false,
  goalType: null,
  goalValue: null,
  timeFrameEnabled: false,
  startDate: null,
  deadlineDate: null,
  alertEnabled: false,
  alertThresholds: 0,
  isAchieved: false,
  displayOptions: {
    showOnDashboard: false,
    priority: null,
    chartType: null,
    color: null,
  },
  createdAt: fixedTimestamp,
  updatedAt: fixedTimestamp,
};

async function settleAsyncUpdates() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function submitMetricSettingsForm(
  user: ReturnType<typeof userEvent.setup>,
  buttonName: RegExp,
) {
  const submitButton = screen.getByRole("button", { name: buttonName });

  if (submitButton.matches(":disabled")) {
    const switches = screen.getAllByRole("switch");
    if (switches[1]) {
      await user.click(switches[1]);
    }
  }

  await waitFor(() => {
    expect(submitButton).toBeEnabled();
  });
  await user.click(submitButton);
}

describe("MetricSettingsForm integration", () => {
  afterEach(async () => {
    await settleAsyncUpdates();
  });

  it("creates settings and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const createPayloadSpy = jest.fn();

    server.use(
      http.post("/api/proxy/metric-settings", async ({ request }) => {
        const body = await request.json();
        createPayloadSpy(body);

        return HttpResponse.json({
          status: "success",
          message: "Metric settings created",
          data: {
            ...existingSettings,
            id: "33333333-3333-4333-8333-333333333333",
          },
        });
      }),
    );

    renderWithProviders(
      <MetricSettingsForm metricId={metricId} initialSettings={null} onClose={onClose} />,
    );

    await submitMetricSettingsForm(user, /^add$/i);

    await waitFor(() => {
      expect(createPayloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricId,
          goalEnabled: false,
          timeFrameEnabled: false,
          alertEnabled: false,
          displayOptions: expect.objectContaining({
            showOnDashboard: expect.any(Boolean),
          }),
        }),
      );
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates settings and closes modal on success", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const updatePayloadSpy = jest.fn();

    server.use(
      http.put("/api/proxy/metric-settings/:id", async ({ params, request }) => {
        const body = await request.json();
        const requestUrl = new URL(request.url);
        updatePayloadSpy({
          id: params.id,
          metricIdFromQuery: requestUrl.searchParams.get("metricId"),
          body,
        });

        return HttpResponse.json({
          status: "success",
          message: "Metric settings updated",
          data: {
            ...existingSettings,
            updatedAt: "2026-02-19T08:00:00.000Z",
          },
        });
      }),
    );

    renderWithProviders(
      <MetricSettingsForm
        metricId={metricId}
        initialSettings={existingSettings}
        onClose={onClose}
      />,
    );

    await submitMetricSettingsForm(user, /^save$/i);

    await waitFor(() => {
      expect(updatePayloadSpy).toHaveBeenCalledWith({
        id: settingsId,
        metricIdFromQuery: metricId,
        body: expect.objectContaining({
          metricId,
          goalEnabled: false,
          displayOptions: expect.objectContaining({
            showOnDashboard: expect.any(Boolean),
          }),
        }),
      });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error message and stays open when create fails", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.post("/api/proxy/metric-settings", () =>
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
        <MetricSettingsForm metricId={metricId} initialSettings={null} onClose={onClose} />,
      );

      await submitMetricSettingsForm(user, /^add$/i);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("has no critical accessibility violations on initial render", async () => {
    const { container } = renderWithProviders(
      <MetricSettingsForm metricId={metricId} initialSettings={null} onClose={jest.fn()} />,
    );
    await settleAsyncUpdates();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
