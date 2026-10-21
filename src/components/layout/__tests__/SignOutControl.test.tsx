import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import SignOutControl from "@/components/layout/SignOutControl";

const SIGN_OUT = "Sign out";

const renderControl = (props: Partial<{ onSignOut: () => void; isSigningOut: boolean }> = {}) =>
  render(<SignOutControl onSignOut={jest.fn()} isSigningOut={false} {...props} />);

/** The trigger and the dialog's confirm button share the name, so the confirm is found inside it. */
const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: SIGN_OUT }));
  return screen.findByRole("dialog", { name: SIGN_OUT });
};

// These cases lived in `Sidebar.int.test.tsx` until the control was shared with the account page
// (kit `mobile-sign-out`, D-01). What signing out does is the caller's: `AppShell.int.test.tsx`
// and `AccountPage.int.test.tsx` assert the endpoint and the redirect.
describe("SignOutControl", () => {
  it("asks first, and Cancel closes the question without signing out", async () => {
    const user = userEvent.setup();
    const onSignOut = jest.fn();
    renderControl({ onSignOut });

    const dialog = await openDialog(user);
    expect(dialog).toHaveAccessibleDescription("Are you sure you want to sign out?");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSignOut).not.toHaveBeenCalled();
  });

  it("calls onSignOut once when the question is confirmed", async () => {
    const user = userEvent.setup();
    const onSignOut = jest.fn();
    renderControl({ onSignOut });

    const dialog = await openDialog(user);
    expect(onSignOut).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: SIGN_OUT }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("disables the confirm button while sign-out is in flight", async () => {
    const user = userEvent.setup();
    const onSignOut = jest.fn();
    renderControl({ onSignOut, isSigningOut: true });

    const dialog = await openDialog(user);
    const confirm = within(dialog).getByRole("button", { name: "Signing out…" });
    expect(confirm).toBeDisabled();

    await user.click(confirm);
    expect(onSignOut).not.toHaveBeenCalled();
  });

  // WCAG 2.5.3 Label in Name (D-02): the trigger said "Sign Out" and was named "Logout", so a
  // speech user saying what they saw had no match. Each name is now exactly the visible text.
  it("names every control by its visible text, with no aria-label over it", async () => {
    const user = userEvent.setup();
    renderControl();

    const trigger = screen.getByRole("button", { name: SIGN_OUT });
    expect(trigger).not.toHaveAttribute("aria-label");
    expect(trigger).toHaveTextContent(SIGN_OUT);

    const dialog = await openDialog(user);
    for (const name of ["Cancel", SIGN_OUT]) {
      const button = within(dialog).getByRole("button", { name });
      expect(button).not.toHaveAttribute("aria-label");
      expect(button).toHaveTextContent(name);
    }
  });

  it("has no accessibility violations, closed or open", async () => {
    const user = userEvent.setup();
    const { container } = renderControl();

    expect(await axe(container)).toHaveNoViolations();

    await openDialog(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
