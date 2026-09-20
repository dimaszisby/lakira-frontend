import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ThemeProvider } from "next-themes";
import { renderToStaticMarkup } from "react-dom/server";

import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { THEME_STORAGE_KEY } from "@/constants/app";

const THEME = "Theme";

/**
 * A real provider rather than a mocked `useTheme`. The thing worth asserting is
 * how the control behaves against the library's actual state machine; a mock
 * would only assert that the component calls a function this file wrote.
 */
const renderSwitcher = () =>
  render(
    <ThemeProvider attribute="data-theme" storageKey={THEME_STORAGE_KEY} defaultTheme="system">
      <ThemeSwitcher />
    </ThemeProvider>,
  );

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  // AC-1
  it("offers System, Light and Dark inside a group named by its visible label", () => {
    renderSwitcher();

    expect(screen.getByRole("radiogroup", { name: THEME })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual([
      "system",
      "light",
      "dark",
    ]);
  });

  // AC-1
  it("preselects the active theme once mounted", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderSwitcher();

    expect(await screen.findByRole("radio", { name: "Dark" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Light" })).not.toBeChecked();
  });

  // AC-6 — the visible label is the accessible name (WCAG 2.5.3). Querying by
  // role and name is the assertion: a mismatch makes these queries fail.
  it("names each segment with its visible text", () => {
    renderSwitcher();

    ["System", "Light", "Dark"].forEach((name) => {
      expect(screen.getByRole("radio", { name })).toBeInTheDocument();
    });
  });

  // AC-8 — the pre-mount state is only observable on the server. `render` flushes
  // effects inside `act`, so by the time anything can be queried the component has
  // already mounted; asserting the disabled state through RTL would assert nothing.
  it("renders every segment disabled and unselected before mount", () => {
    const markup = renderToStaticMarkup(
      <ThemeProvider attribute="data-theme" storageKey={THEME_STORAGE_KEY} defaultTheme="system">
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    expect(markup.match(/<input[^>]*type="radio"/g)).toHaveLength(3);
    expect(markup.match(/<input[^>]*\sdisabled=""/g)).toHaveLength(3);
    expect(markup.match(/aria-checked="false"/g)).toHaveLength(3);
    expect(markup).not.toContain('aria-checked="true"');
  });

  // AC-8 — and it becomes operable once mounted.
  it("is operable after mount", async () => {
    renderSwitcher();

    expect(await screen.findByRole("radio", { name: "Light" })).toBeEnabled();
  });

  // AC-5 — clicking is the half jsdom can prove. Arrow-key selection depends on
  // Ariakit's focus handling over native radios and is verified by a manual
  // keyboard pass in the browser; see the checklist.
  it("records the chosen theme", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(await screen.findByRole("radio", { name: "Light" }));

    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("has no axe violations", async () => {
    const { container } = renderSwitcher();

    expect(await axe(container)).toHaveNoViolations();
  });
});
