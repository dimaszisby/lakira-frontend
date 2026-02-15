import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import Modal from "@/components/ui/Modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Body</div>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title/description and closes from the close button", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal
        isOpen
        onClose={onClose}
        title="Delete item"
        description="This action cannot be undone"
      >
        <button type="button">Confirm</button>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: /delete item/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-describedby");

    await user.click(screen.getByRole("button", { name: /close modal/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on overlay click but not on dialog-content click", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal isOpen onClose={onClose} title="Overlay">
        <button type="button">Inner action</button>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: /inner action/i }));
    expect(onClose).toHaveBeenCalledTimes(0);

    await user.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("respects closeOnOverlayClick=false", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal isOpen onClose={onClose} closeOnOverlayClick={false} title="Overlay">
        <button type="button">Inner action</button>
      </Modal>,
    );

    await user.click(screen.getByRole("dialog").parentElement as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Modal isOpen onClose={onClose} title="Escape close">
        <button type="button">Inner action</button>
      </Modal>,
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps focus within modal while open", async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={() => {}} hideClose title="Focus trap">
        <div>
          <button type="button">First</button>
          <button type="button">Second</button>
        </div>
      </Modal>,
    );

    const first = screen.getByRole("button", { name: /first/i });
    const second = screen.getByRole("button", { name: /second/i });

    expect(first).toHaveFocus();

    await user.tab();
    expect(second).toHaveFocus();

    await user.tab();
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(second).toHaveFocus();
  });

  it("restores focus to trigger element after close", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open modal
          </button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Restore focus">
            <button type="button">Action</button>
          </Modal>
        </>
      );
    };

    render(<Harness />);

    const trigger = screen.getByRole("button", { name: /open modal/i });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [open, setOpen] = useState(true);

      return (
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Scroll lock">
          <button type="button">Action</button>
        </Modal>
      );
    };

    render(<Harness />);

    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });
});
