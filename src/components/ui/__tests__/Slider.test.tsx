import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import Slider from "@/components/ui/Slider";

const ARIA_VALUE_NOW = "aria-valuenow";

describe("Slider", () => {
  it("updates via keyboard and calls onChangeEnd", async () => {
    const user = userEvent.setup();
    const onChangeEnd = jest.fn();

    const Harness = () => {
      const [value, setValue] = useState(50);
      return (
        <Slider
          value={value}
          onChange={setValue}
          onChangeEnd={onChangeEnd}
          min={0}
          max={100}
          step={5}
          aria-label="Alert threshold"
          showValue="inline"
          valueFormatter={(nextValue) => `${nextValue}%`}
        />
      );
    };

    render(<Harness />);

    const slider = screen.getByRole("slider", { name: /alert threshold/i });
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "55");
    expect(onChangeEnd).toHaveBeenCalledWith(55);
    expect(screen.getByText("55%")).toBeInTheDocument();

    await user.keyboard("{Home}");
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "0");
  });

  it("supports allowed value snapping with arrow keys", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [value, setValue] = useState(20);
      return (
        <Slider
          value={value}
          onChange={setValue}
          allowed={[10, 20, 40]}
          aria-label="Priority"
          showValue="inline"
        />
      );
    };

    render(<Harness />);

    const slider = screen.getByRole("slider", { name: /priority/i });
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "40");

    await user.keyboard("{ArrowLeft}");
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "20");
  });

  it("renders mark labels when markLabel is provided", () => {
    render(
      <Slider
        value={50}
        onChange={() => {}}
        min={0}
        max={100}
        marks={[0, 50, 100]}
        markLabel={(nextValue) => `${nextValue}%`}
        aria-label="Progress"
      />,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("supports steppers and respects min/max disabled states", async () => {
    const user = userEvent.setup();
    const onChangeEnd = jest.fn();

    const Harness = () => {
      const [value, setValue] = useState(0);
      return (
        <Slider
          value={value}
          onChange={setValue}
          onChangeEnd={onChangeEnd}
          min={0}
          max={10}
          step={5}
          showSteppers
          aria-label="Stepper slider"
        />
      );
    };

    render(<Harness />);

    const decreaseButton = screen.getByRole("button", { name: /decrease/i });
    const increaseButton = screen.getByRole("button", { name: /increase/i });
    const slider = screen.getByRole("slider", { name: /stepper slider/i });

    expect(decreaseButton).toBeDisabled();
    expect(increaseButton).toBeEnabled();

    await user.click(increaseButton);
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "5");
    expect(onChangeEnd).toHaveBeenCalledWith(5);

    await user.click(increaseButton);
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "10");
    expect(increaseButton).toBeDisabled();
  });
});
