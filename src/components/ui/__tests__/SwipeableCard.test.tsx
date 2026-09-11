import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type * as React from "react";

import type { SwipeAction } from "@/components/ui/SwipeableCard";
import { SwipeableCard } from "@/components/ui/SwipeableCard";

const MORE_ACTIONS = "More actions";
const ARIA_EXPANDED = "aria-expanded";

const mockStart = jest.fn(() => Promise.resolve());

jest.mock("framer-motion", () => {
  const ReactRuntime = require("react") as typeof React;

  type MockMotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
    style?: React.CSSProperties & { x?: unknown };
    drag?: unknown;
    animate?: unknown;
    transition?: unknown;
    dragConstraints?: unknown;
    dragDirectionLock?: unknown;
    dragElastic?: unknown;
    onDragStart?: unknown;
    onDragEnd?: unknown;
  };

  const MotionDiv = ({
    style,
    drag: _drag,
    animate: _animate,
    transition: _transition,
    dragConstraints: _dragConstraints,
    dragDirectionLock: _dragDirectionLock,
    dragElastic: _dragElastic,
    onDragStart: _onDragStart,
    onDragEnd: _onDragEnd,
    ...rest
  }: MockMotionDivProps) => {
    const nextStyle: React.CSSProperties & { x?: unknown } = { ...(style ?? {}) };
    delete nextStyle.x;
    return ReactRuntime.createElement("div", { style: nextStyle, ...rest });
  };

  return {
    motion: { div: MotionDiv },
    useAnimation: () => ({ start: mockStart }),
    useMotionValue: (initial: number) => ({ get: () => initial, set: () => {} }),
    useReducedMotion: () => false,
  };
});

const createActions = (): SwipeAction[] => [
  { label: "Edit", onClick: jest.fn(), tone: "info" },
  { label: "Delete", onClick: jest.fn(), tone: "danger" },
];

const actionsPanelFor = (toggle: HTMLElement) =>
  document.getElementById(toggle.getAttribute("aria-controls") ?? "");

describe("SwipeableCard", () => {
  beforeEach(() => {
    mockStart.mockClear();
  });

  it("keeps the actions inert while closed", () => {
    render(
      <SwipeableCard actions={createActions()} open={false}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    const toggle = screen.getByRole("button", { name: MORE_ACTIONS });
    expect(toggle).toHaveAttribute(ARIA_EXPANDED, "false");
    expect(actionsPanelFor(toggle)).toHaveAttribute("inert");
  });

  it("opens the actions from the More actions button without swiping", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(
      <SwipeableCard actions={createActions()} onOpenChange={onOpenChange}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    await user.click(screen.getByRole("button", { name: MORE_ACTIONS }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    const toggle = screen.getByRole("button", { name: "Hide actions" });
    expect(toggle).toHaveAttribute(ARIA_EXPANDED, "true");
    expect(actionsPanelFor(toggle)).not.toHaveAttribute("inert");
  });

  it("runs an action and closes the panel", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const actions = createActions();

    render(
      <SwipeableCard actions={actions} open onClose={onClose}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(actions[0]?.onClick).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("exposes each action tone to the recipe", () => {
    render(
      <SwipeableCard actions={createActions()} open>
        <span>Card body</span>
      </SwipeableCard>,
    );

    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("data-tone", "danger");
  });

  it("closes on outside pointer interaction when open", () => {
    const onClose = jest.fn();

    render(
      <div>
        <SwipeableCard actions={createActions()} open onClose={onClose}>
          <span>Card body</span>
        </SwipeableCard>
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: /outside/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape and returns focus to the toggle", async () => {
    const user = userEvent.setup();

    render(
      <SwipeableCard actions={createActions()}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    await user.click(screen.getByRole("button", { name: MORE_ACTIONS }));
    screen.getByRole("button", { name: "Edit" }).focus();
    await user.keyboard("{Escape}");

    const toggle = screen.getByRole("button", { name: MORE_ACTIONS });
    expect(toggle).toHaveAttribute(ARIA_EXPANDED, "false");
    expect(toggle).toHaveFocus();
  });

  it("closes instead of activating content when tapped while open", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const childClick = jest.fn();

    render(
      <SwipeableCard actions={createActions()} open onClose={onClose}>
        <button type="button" onClick={childClick}>
          Card child
        </button>
      </SwipeableCard>,
    );

    await user.click(screen.getByRole("button", { name: /card child/i }));

    expect(onClose).toHaveBeenCalled();
    expect(childClick).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <SwipeableCard actions={createActions()}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
