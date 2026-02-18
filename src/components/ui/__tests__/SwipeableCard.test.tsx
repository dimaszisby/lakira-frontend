import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";

import SwipeableCard from "@/components/ui/SwipeableCard";

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
  };

  const MotionDiv = ReactRuntime.forwardRef<HTMLDivElement, MockMotionDivProps>(
    (
      {
        style,
        drag: _drag,
        animate: _animate,
        transition: _transition,
        dragConstraints: _dragConstraints,
        dragDirectionLock: _dragDirectionLock,
        dragElastic: _dragElastic,
        ...rest
      },
      ref,
    ) => {
      const nextStyle: React.CSSProperties & { x?: unknown } = { ...(style ?? {}) };
      delete nextStyle.x;
      return <div ref={ref} style={nextStyle} {...rest} />;
    },
  );
  MotionDiv.displayName = "MockMotionDiv";

  return {
    motion: { div: MotionDiv },
    useAnimation: () => ({ start: mockStart }),
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: () => {},
    }),
  };
});

describe("SwipeableCard", () => {
  beforeEach(() => {
    mockStart.mockClear();
  });

  const actions = [
    { label: "Edit", onClick: jest.fn(), color: "bg-info" },
    { label: "Delete", onClick: jest.fn(), color: "bg-status-error" },
  ];

  it("keeps action buttons unfocusable when closed", () => {
    render(
      <SwipeableCard actions={actions} open={false}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    const editButton = document.querySelector<HTMLButtonElement>('button[aria-label="Edit"]');
    const deleteButton = document.querySelector<HTMLButtonElement>('button[aria-label="Delete"]');

    expect(editButton).not.toBeNull();
    expect(deleteButton).not.toBeNull();
    expect(editButton).toHaveAttribute("tabindex", "-1");
    expect(deleteButton).toHaveAttribute("tabindex", "-1");
  });

  it("invokes action click and closes panel", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <SwipeableCard actions={actions} open onClose={onClose}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(actions[0]?.onClick).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on outside pointer interaction when open", () => {
    const onClose = jest.fn();

    render(
      <div>
        <SwipeableCard actions={actions} open onClose={onClose}>
          <span>Card body</span>
        </SwipeableCard>
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: /outside/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape key when open", () => {
    const onClose = jest.fn();

    render(
      <SwipeableCard actions={actions} open onClose={onClose}>
        <span>Card body</span>
      </SwipeableCard>,
    );

    fireEvent.keyDown(screen.getByText("Card body"), { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("closes card when tapping card content while open", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const childClick = jest.fn();

    render(
      <SwipeableCard actions={actions} open onClose={onClose}>
        <button type="button" onClick={childClick}>
          Card child
        </button>
      </SwipeableCard>,
    );

    await user.click(screen.getByRole("button", { name: /card child/i }));

    expect(onClose).toHaveBeenCalled();
    expect(childClick).not.toHaveBeenCalled();
  });
});
