import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";

import type { SliderProps } from "@/components/ui/Slider";
import { Slider } from "@/components/ui/Slider";

const ARIA_VALUE_NOW = "aria-valuenow";
const ARROW_RIGHT = "{ArrowRight}";

const ControlledSlider = (props: Omit<SliderProps, "value" | "onChange"> & { initial: number }) => {
  const { initial, ...rest } = props;
  const [value, setValue] = useState(initial);
  return <Slider value={value} onChange={setValue} {...rest} />;
};

describe("Slider", () => {
  it("updates via keyboard and calls onChangeEnd", async () => {
    const user = userEvent.setup();
    const onChangeEnd = jest.fn();

    render(
      <ControlledSlider
        initial={50}
        onChangeEnd={onChangeEnd}
        min={0}
        max={100}
        step={5}
        aria-label="Alert threshold"
        valueFormatter={(nextValue) => `${nextValue}%`}
      />,
    );

    const slider = screen.getByRole("slider", { name: /alert threshold/i });
    await user.tab();
    expect(slider).toHaveFocus();

    await user.keyboard(ARROW_RIGHT);
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "55");
    expect(onChangeEnd).toHaveBeenCalledWith(55);
    expect(screen.getByText("55%")).toBeInTheDocument();

    await user.keyboard("{Home}");
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "0");

    await user.keyboard("{End}");
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "100");
  });

  it("snaps to allowed values with arrow keys", async () => {
    const user = userEvent.setup();

    render(<ControlledSlider initial={20} allowed={[10, 20, 40]} aria-label="Priority" />);

    const slider = screen.getByRole("slider", { name: /priority/i });
    await user.tab();

    await user.keyboard(ARROW_RIGHT);
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "40");

    await user.keyboard("{ArrowLeft}");
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "20");
  });

  it("renders mark labels when markLabel is provided", () => {
    render(
      <Slider
        value={50}
        onChange={() => {}}
        marks={[0, 50, 100]}
        markLabel={(nextValue) => `${nextValue}%`}
        aria-label="Progress"
        showValue="none"
      />,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("steps with the stepper buttons and disables them at the bounds", async () => {
    const user = userEvent.setup();
    const onChangeEnd = jest.fn();

    render(
      <ControlledSlider
        initial={0}
        onChangeEnd={onChangeEnd}
        min={0}
        max={10}
        step={5}
        showSteppers
        aria-label="Stepper slider"
      />,
    );

    const decrease = screen.getByRole("button", { name: /decrease/i });
    const increase = screen.getByRole("button", { name: /increase/i });
    const slider = screen.getByRole("slider", { name: /stepper slider/i });

    expect(decrease).toBeDisabled();

    await user.click(increase);
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "5");
    expect(onChangeEnd).toHaveBeenCalledWith(5);

    await user.click(increase);
    expect(slider).toHaveAttribute(ARIA_VALUE_NOW, "10");
    expect(increase).toBeDisabled();
  });

  it("ignores keyboard input and leaves the tab order when disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<Slider value={50} onChange={onChange} disabled aria-label="Volume" />);

    const slider = screen.getByRole("slider", { name: /volume/i });
    expect(slider).toHaveAttribute("aria-disabled", "true");
    expect(slider).toHaveAttribute("tabindex", "-1");

    slider.focus();
    await user.keyboard(ARROW_RIGHT);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Slider
        value={40}
        onChange={() => {}}
        showSteppers
        marks={[0, 50, 100]}
        aria-label="Volume"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
