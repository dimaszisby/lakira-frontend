import { fireEvent, render, screen } from "@testing-library/react";

import TimeRangePicker from "@/features/data-visualizations/components/TimeRangePicker";
import type { TimeRangeValue } from "@/features/data-visualizations/types";

describe("TimeRangePicker", () => {
  const relativeValue: TimeRangeValue = { mode: "relative", last: "30d" };
  const absoluteValue: TimeRangeValue = {
    mode: "absolute",
    start: "2026-02-01T10:00:00.000Z",
    end: "2026-02-10T12:00:00.000Z",
  };

  it("emits normalized relative value and normalizes input on blur", () => {
    const onChange = jest.fn();
    render(<TimeRangePicker value={relativeValue} onChange={onChange} />);

    const lastInput = screen.getByLabelText("Last");
    fireEvent.change(lastInput, { target: { value: "7D" } });
    fireEvent.blur(lastInput);

    expect(onChange).toHaveBeenCalledWith({ mode: "relative", last: "7d" });
    expect(lastInput).toHaveValue("7d");
  });

  it("does not emit invalid relative value and resets draft on blur", () => {
    const onChange = jest.fn();
    render(<TimeRangePicker value={relativeValue} onChange={onChange} />);

    const lastInput = screen.getByLabelText("Last");
    fireEvent.change(lastInput, { target: { value: "invalid" } });
    fireEvent.blur(lastInput);

    expect(onChange).not.toHaveBeenCalled();
    expect(lastInput).toHaveValue("30d");
  });

  it("emits absolute range when switching from relative to custom mode", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-26T12:00:00.000Z"));
    const onChange = jest.fn();

    render(<TimeRangePicker value={relativeValue} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Range mode"), {
      target: { value: "absolute" },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "absolute",
      start: "2026-01-27T12:00:00.000Z",
      end: "2026-02-26T12:00:00.000Z",
    });

    jest.useRealTimers();
  });

  it("emits relative fallback when switching from absolute to relative mode", () => {
    const onChange = jest.fn();
    render(<TimeRangePicker value={absoluteValue} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Range mode"), {
      target: { value: "relative" },
    });

    expect(onChange).toHaveBeenCalledWith({ mode: "relative", last: "30d" });
  });

  it("updates absolute start while preserving end", () => {
    const onChange = jest.fn();
    render(<TimeRangePicker value={absoluteValue} onChange={onChange} />);

    const nextStartLocal = "2026-02-02T09:30";
    fireEvent.change(screen.getByLabelText("Start"), {
      target: { value: nextStartLocal },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "absolute",
      start: new Date(nextStartLocal).toISOString(),
      end: "2026-02-10T12:00:00.000Z",
    });
  });

  it("updates absolute end while preserving start", () => {
    const onChange = jest.fn();
    render(<TimeRangePicker value={absoluteValue} onChange={onChange} />);

    const nextEndLocal = "2026-02-15T18:45";
    fireEvent.change(screen.getByLabelText("End"), {
      target: { value: nextEndLocal },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "absolute",
      start: "2026-02-01T10:00:00.000Z",
      end: new Date(nextEndLocal).toISOString(),
    });
  });
});
