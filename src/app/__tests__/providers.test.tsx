import { act, render, screen } from "@testing-library/react";
import { toast } from "react-hot-toast";

import { Providers } from "@/app/providers";

/**
 * The root providers mount the one `<Toaster>`. Without it every `toast()` call
 * renders nothing: the sign-out toasts in `AppShell.tsx` never showed until
 * 2026-10-18 (register row F-53). It sits at the root, not in the `(app)` shell,
 * because signing out navigates to `/login` and unmounts that shell as the toast
 * appears.
 */
describe("Providers", () => {
  afterEach(() => {
    act(() => {
      toast.remove();
    });
  });

  it("shows a toast when one is raised", async () => {
    render(
      <Providers>
        <p>page</p>
      </Providers>,
    );

    act(() => {
      toast.success("Logged out successfully");
    });

    expect(await screen.findByRole("status")).toHaveTextContent("Logged out successfully");
  });
});
