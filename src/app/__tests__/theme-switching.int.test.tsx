import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode } from "react";

import { Providers } from "@/app/providers";
import { THEME_STORAGE_KEY } from "@/constants/app";
import { ThemeSwitcher } from "@/ui/ThemeSwitcher";

/**
 * Wires the real `Providers` to the real control.
 *
 * The unit suite covers the component. What this asserts is the configuration in
 * `src/app/providers.tsx` — that `attribute="data-theme"` reaches `<html>`, and
 * that `storageKey` is the same key `public/scripts/theme-init.js` reads before
 * paint. Those two have drifted apart once already; the comment in providers.tsx
 * records that the pre-paint script then never found a stored choice, and a user
 * whose choice differed from their OS got a flash of the wrong theme on every
 * load. Neither half is visible from the component alone.
 *
 * StrictMode because `next dev` runs it, and jsdom without it has hidden real
 * effect-ordering bugs in this repo twice.
 */
const DATA_THEME = "data-theme";
const DARK = "Dark";
const LIGHT = "Light";

const renderThemeSwitching = () =>
  render(
    <StrictMode>
      <Providers>
        <ThemeSwitcher />
      </Providers>
    </StrictMode>,
  );

describe("theme switching", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute(DATA_THEME);
    document.documentElement.removeAttribute("class");
  });

  // AC-2
  it("applies the chosen theme to the html element as data-theme", async () => {
    const user = userEvent.setup();
    renderThemeSwitching();

    await user.click(await screen.findByRole("radio", { name: DARK }));

    expect(document.documentElement.getAttribute(DATA_THEME)).toBe("dark");

    await user.click(screen.getByRole("radio", { name: LIGHT }));

    expect(document.documentElement.getAttribute(DATA_THEME)).toBe("light");
  });

  // AC-3 — the key must match the literal in public/scripts/theme-init.js.
  it("persists the choice under the key the pre-paint script reads", async () => {
    const user = userEvent.setup();
    renderThemeSwitching();

    await user.click(await screen.findByRole("radio", { name: DARK }));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(THEME_STORAGE_KEY).toBe("lakira.theme");
  });

  // AC-1 — a stored choice is what the control comes up on.
  it("restores a stored choice on mount", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    renderThemeSwitching();

    expect(await screen.findByRole("radio", { name: LIGHT })).toBeChecked();
    expect(document.documentElement.getAttribute(DATA_THEME)).toBe("light");
  });

  it("has no axe violations", async () => {
    const { container } = renderThemeSwitching();

    expect(await axe(container)).toHaveNoViolations();
  });
});
