import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LogMobileCard from "@/features/metric-logs/components/LogMobileCard";
import type { MetricLogVM } from "@/features/metric-logs/view-models";

const ISO_1 = "2026-02-10T10:00:00.000Z";

const log: MetricLogVM = {
  id: "log-1",
  metricId: "metric-1",
  logValue: 120,
  loggedAt: ISO_1,
  type: "manual",
  createdAt: ISO_1,
  updatedAt: ISO_1,
};

describe("LogMobileCard", () => {
  it("renders an accessible button with formatted content", () => {
    render(<LogMobileCard log={log} />);

    expect(screen.getByRole("button", { name: /open log from/i })).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("invokes onClick with the current log when clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<LogMobileCard log={log} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /open log from/i }));

    expect(onClick).toHaveBeenCalledWith(log);
  });
});
