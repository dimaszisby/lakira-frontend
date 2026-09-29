// AC-4 of cypress-a11y-e2e: WCAG 2.4.3 Focus Order and 2.4.7 Focus Visible on /login. jsdom has
// no layout and no real focus, so this is the layer that can check either.

const MAX_TABS = 15;

/** The login form's controls, in the order Tab must reach them. */
const FORM_ORDER = [
  "input[email]",
  "input[password]",
  "button[Show password]",
  "a[Reset your password]",
  "button[Login]",
];

const describeElement = (el: Element): string => {
  const tag = el.tagName.toLowerCase();
  // Attributes, not `instanceof`: the element belongs to the app's window, not the spec's.
  const name =
    tag === "input"
      ? (el.getAttribute("name") ?? "")
      : (el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "");
  return `${tag}[${name}]`;
};

/** A ring on the element itself, or on the `.input-shell` that draws it for fields. */
const hasVisibleFocus = (el: Element): boolean =>
  [el, el.closest(".input-shell")].some((node) => {
    if (!node) return false;
    const style = getComputedStyle(node);
    return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
  });

describe("Login by keyboard", () => {
  it("reaches every form control in order, each with a visible focus indicator", () => {
    cy.visitInTheme("/login", "light");

    const reached: string[] = [];
    const unfocusedVisibly: string[] = [];

    const tabUntilSubmit = (remaining: number): void => {
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.focused().then(($el) => {
        const el = $el[0];
        const label = describeElement(el);
        reached.push(label);
        if (FORM_ORDER.includes(label) && !hasVisibleFocus(el)) unfocusedVisibly.push(label);
        if (label !== "button[Login]" && remaining > 1) tabUntilSubmit(remaining - 1);
      });
    };
    tabUntilSubmit(MAX_TABS);

    cy.wrap(reached).then(() => {
      cy.task("log", `Tab order on /login: ${reached.join(" > ")}`).then(() => {
        expect(reached.filter((label) => FORM_ORDER.includes(label))).to.deep.equal(FORM_ORDER);
        expect(unfocusedVisibly, "controls without a visible focus indicator").to.deep.equal([]);
      });
    });
  });
});
