import { render, screen } from "@testing-library/react";

import { OrganizationProvider, useOrganizationId } from "../context";
import { organizationKeys } from "../keys";

const ORG_A = "org-aaaaaaaa-0000-4000-8000-000000000001";
const ORG_B = "org-bbbbbbbb-0000-4000-8000-000000000002";

const Probe = () => <span data-testid="org">{useOrganizationId()}</span>;

describe("useOrganizationId", () => {
  it("returns the organization from the nearest provider", () => {
    render(
      <OrganizationProvider organizationId={ORG_A}>
        <Probe />
      </OrganizationProvider>,
    );
    expect(screen.getByTestId("org")).toHaveTextContent(ORG_A);
  });

  it("throws outside a provider rather than returning undefined", () => {
    // The whole safety argument rests on this. A silent `undefined` would
    // produce a cache key that does not identify its tenant, which is how one
    // organization ends up served another's data.
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow(/OrganizationProvider/);

    consoleError.mockRestore();
  });

  it("throws on an empty organization id", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      render(
        <OrganizationProvider organizationId="">
          <Probe />
        </OrganizationProvider>,
      ),
    ).toThrow(/OrganizationProvider/);

    consoleError.mockRestore();
  });

  it("scopes nested providers independently", () => {
    render(
      <OrganizationProvider organizationId={ORG_A}>
        <OrganizationProvider organizationId={ORG_B}>
          <Probe />
        </OrganizationProvider>
      </OrganizationProvider>,
    );
    expect(screen.getByTestId("org")).toHaveTextContent(ORG_B);
  });
});

describe("organizationKeys", () => {
  it("differs across organizations", () => {
    expect(organizationKeys.members(ORG_A)).not.toEqual(organizationKeys.members(ORG_B));
  });

  it("places the organization id at index 1, like every other factory", () => {
    expect(organizationKeys.all(ORG_A)[0]).toBe("organizations");
    expect(organizationKeys.all(ORG_A)[1]).toBe(ORG_A);
  });

  it("nests members under the org root so prefix invalidation stays scoped", () => {
    const root = organizationKeys.all(ORG_A);
    const members = organizationKeys.members(ORG_A);
    expect(members.slice(0, root.length)).toEqual([...root]);
  });
});
