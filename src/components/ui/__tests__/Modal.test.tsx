import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useRef, useState } from "react";

import { Modal } from "@/components/ui/Modal";

const CLOSE_NAME = /close modal/i;

/** Ariakit renders the scrim as a sibling of the dialog, marked with data-backdrop. */
const getBackdrop = () => {
  const backdrop = document.querySelector<HTMLElement>("[data-backdrop]");
  if (!backdrop) throw new Error("Dialog backdrop not rendered");
  return backdrop;
};

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        <div>Body</div>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("is named and described by its title and description", async () => {
    render(
      <Modal open onClose={() => {}} title="Delete item" description="This action cannot be undone">
        <button type="button">Confirm</button>
      </Modal>,
    );

    const dialog = await screen.findByRole("dialog", { name: "Delete item" });
    expect(dialog).toHaveAccessibleDescription("This action cannot be undone");
  });

  it("uses aria-label when there is no title", async () => {
    render(
      <Modal open onClose={() => {}} aria-label="Quick edit">
        <p>Body</p>
      </Modal>,
    );

    expect(await screen.findByRole("dialog", { name: "Quick edit" })).toBeInTheDocument();
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal open onClose={onClose} title="Close me">
        <p>Body</p>
      </Modal>,
    );

    const dialog = await screen.findByRole("dialog", { name: "Close me" });
    await user.click(within(dialog).getByRole("button", { name: CLOSE_NAME }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal open onClose={onClose} title="Escape close">
        <button type="button">Inner action</button>
      </Modal>,
    );

    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on an outside click but not on a click inside", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal open onClose={onClose} title="Overlay">
        <button type="button">Inner action</button>
      </Modal>,
    );

    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /inner action/i }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(getBackdrop());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open on an outside click when closeOnOverlayClick is false", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal open onClose={onClose} closeOnOverlayClick={false} title="Sticky">
        <p>Body</p>
      </Modal>,
    );

    await screen.findByRole("dialog");
    await user.click(getBackdrop());

    expect(onClose).not.toHaveBeenCalled();
  });

  it("moves focus into the dialog and makes the rest of the page inert", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Modal open onClose={() => {}} hideClose title="Focus trap">
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>,
    );

    const first = await screen.findByRole("button", { name: "First" });
    await waitFor(() => expect(first).toHaveFocus());

    await user.tab();
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();

    // Browsers keep Tab inside the dialog because everything outside it is inert.
    // jsdom does not apply inert to keyboard navigation, so assert the mechanism itself.
    await waitFor(() => expect(container).toHaveAttribute("inert"));
  });

  it("focuses initialFocusRef when provided", async () => {
    const Harness = () => {
      const saveRef = useRef<HTMLButtonElement>(null);
      return (
        <Modal open onClose={() => {}} title="Initial focus" initialFocusRef={saveRef}>
          <button type="button">Cancel</button>
          <button type="button" ref={saveRef}>
            Save
          </button>
        </Modal>
      );
    };

    render(<Harness />);

    const save = await screen.findByRole("button", { name: "Save" });
    await waitFor(() => expect(save).toHaveFocus());
  });

  it("returns focus to the trigger after closing", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open modal
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Restore focus">
            <button type="button">Action</button>
          </Modal>
        </>
      );
    };

    render(<Harness />);

    const trigger = screen.getByRole("button", { name: /open modal/i });
    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("has no axe violations", async () => {
    render(
      <Modal open onClose={() => {}} title="Accessible" description="Checked by axe">
        <button type="button">Confirm</button>
      </Modal>,
    );

    await screen.findByRole("dialog");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
