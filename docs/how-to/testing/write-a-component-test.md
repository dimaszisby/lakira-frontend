# Write a component test

Colocated in `__tests__/` beside the component, named `<Component>.test.tsx` for unit and
`<Component>.int.test.tsx` for integration. **Never both kinds in one file** — one suite will
silently skip it.

## Render

For a plain presentational component, `render` from Testing Library is enough. For anything using a
query hook or a Jotai atom, use the wrapper:

```tsx
import { renderWithProviders } from "@/test-utils/renderWithProviders";

renderWithProviders(<TagList />, {
  route: "/tags?q=work",
  initialQueryData: [[tagsKeys.lists(), [tagFixture]]],
});
```

It supplies the Jotai Provider and a QueryClient with retries disabled. Plain `render` on such a
component fails with a missing-provider error.

## Assert on contract, not on styling

Jest maps CSS through `identity-obj-proxy`, so no real styles load. Assert the recipe class and the
`data-*` attributes that drive variants:

```tsx
expect(badge).toHaveClass("badge");
expect(badge).toHaveAttribute("data-variant", "danger");
```

Asserting a computed colour tests nothing.

## Query by role first

```tsx
screen.getByRole("button", { name: "Save" }); // preferred
screen.getByLabelText("Name"); // form controls
screen.getByTestId("badge"); // last resort
```

Role queries fail when the accessible name breaks, which is usually the bug you wanted caught.

## Accessibility

`toHaveNoViolations` is registered globally in `jest.setup.ts`:

```tsx
it("has no accessibility violations", async () => {
  const { container } = render(<Badge>Active</Badge>);
  expect(await axe(container)).toHaveNoViolations();
});
```

`jest-axe` catches contrast, labelling, and ARIA misuse — not keyboard behaviour. Test focus order
and Escape handling explicitly with `userEvent`.

## User interaction

```tsx
const user = userEvent.setup();
await user.click(screen.getByRole("button", { name: "Delete" }));
```

Prefer `userEvent` over `fireEvent` — it dispatches the full event sequence a real interaction
produces, which is what focus-management bugs need in order to appear.

## Integration tests

`*.int.test.tsx` runs under `jest.integration.config.ts`. Note that `src/test-utils/msw/handlers.ts`
is an empty array while the MSW server runs with `onUnhandledRequest: "error"`, so existing
integration tests **mock feature hooks at the module level** rather than intercepting HTTP. Follow
that pattern; adding a handler without checking the rest of the suite will surprise you.

## Run it

```bash
npx jest --config jest.unit.config.ts src/components/ui/__tests__/Badge.test.tsx
```

## Related

- [`run-the-test-suites.md`](./run-the-test-suites.md)
- [`../../reference/components/component-testing-and-quality-gates.md`](../../reference/components/component-testing-and-quality-gates.md)
