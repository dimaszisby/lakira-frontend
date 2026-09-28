import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import OrganizationSwitcher from "@/features/organizations/components/OrganizationSwitcher";
import { hardNavigate } from "@/lib/hard-navigate";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

jest.mock("@/lib/hard-navigate", () => ({ hardNavigate: jest.fn() }));

const mockHardNavigate = jest.mocked(hardNavigate);

const ORGANIZATIONS_URL = "*/organizations";
const SWITCH_URL = "*/auth/switch-org";
const SESSION_URL = "/api/auth/session";

/** The switch button for the non-current organization in most tests. */
const SWITCH_TO_BETA = { name: "Switch to Beta" };

const NEW_TOKEN = "switched-session-token";

const acme = {
  organizationId: "org-acme",
  name: "Acme",
  slug: "acme",
  role: "owner" as const,
  joinedAt: "2026-01-10T09:00:00Z",
  isCurrent: true,
};

const beta = {
  organizationId: "org-beta",
  name: "Beta",
  slug: "beta",
  role: "member" as const,
  joinedAt: "2026-05-01T09:00:00Z",
  isCurrent: false,
};

const listResponse = (organizations: unknown[]) =>
  HttpResponse.json({ status: "success", message: "Success", data: { organizations } });

// A status the API client does not retry. `axios-retry` retries GETs on 5xx
// with exponential backoff (src/services/api/api.ts), which would hold the
// component in its loading state for seconds; the error state itself does not
// depend on which status arrived.
const listFailure = () =>
  HttpResponse.json({ status: "fail", message: "Forbidden" }, { status: 403 });

const useOrganizations = (organizations: unknown[]) =>
  server.use(http.get(ORGANIZATIONS_URL, () => listResponse(organizations)));

describe("OrganizationSwitcher", () => {
  beforeEach(() => {
    mockHardNavigate.mockReset();
  });

  describe("listing", () => {
    it("lists every organization with the user's role in it (AC-1)", async () => {
      useOrganizations([acme, beta]);

      renderWithProviders(<OrganizationSwitcher />);

      const list = await screen.findByRole("list");
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(within(items[0]).getByText("Acme")).toBeInTheDocument();
      expect(within(items[0]).getByText(/Owner/)).toBeInTheDocument();
      expect(within(items[1]).getByText("Beta")).toBeInTheDocument();
      expect(within(items[1]).getByText(/Member/)).toBeInTheDocument();
    });

    it("marks the current organization in text and offers it no switch (AC-2)", async () => {
      useOrganizations([acme, beta]);

      renderWithProviders(<OrganizationSwitcher />);

      const [acmeItem, betaItem] = within(await screen.findByRole("list")).getAllByRole("listitem");
      expect(within(acmeItem).getByText(/Current/)).toBeInTheDocument();
      expect(within(acmeItem).queryByRole("button")).not.toBeInTheDocument();
      expect(within(betaItem).queryByText(/Current/)).not.toBeInTheDocument();
    });

    it("names each switch button after its organization (AC-3)", async () => {
      useOrganizations([acme, beta]);

      renderWithProviders(<OrganizationSwitcher />);

      expect(await screen.findByRole("button", SWITCH_TO_BETA)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Switch to Acme/ })).not.toBeInTheDocument();
    });

    it("shows a single organization as current, with no buttons (AC-9)", async () => {
      useOrganizations([acme]);

      renderWithProviders(<OrganizationSwitcher />);

      expect(await screen.findByText("You belong to one organization.")).toBeInTheDocument();
      expect(screen.getByText(/Current/)).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows a loading state until the list arrives (AC-9)", async () => {
      useOrganizations([acme, beta]);

      renderWithProviders(<OrganizationSwitcher />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      await screen.findByRole("list");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("shows an error with a retry that recovers (AC-9)", async () => {
      let calls = 0;
      server.use(
        http.get(ORGANIZATIONS_URL, () => {
          calls += 1;
          return calls === 1 ? listFailure() : listResponse([acme, beta]);
        }),
      );
      const user = userEvent.setup();

      renderWithProviders(<OrganizationSwitcher />);

      await user.click(await screen.findByRole("button", { name: "Try again" }));

      expect(await screen.findByRole("button", SWITCH_TO_BETA)).toBeInTheDocument();
      expect(calls).toBe(2);
    });
  });

  describe("switching", () => {
    it("switches, stores the new session, then reloads into /dashboard (AC-4)", async () => {
      useOrganizations([acme, beta]);
      let switchBody: unknown;
      let sessionBody: unknown;
      server.use(
        http.post(SWITCH_URL, async ({ request }) => {
          switchBody = await request.json();
          return HttpResponse.json({ status: "success", data: { token: NEW_TOKEN } });
        }),
        http.post(SESSION_URL, async ({ request }) => {
          sessionBody = await request.json();
          return HttpResponse.json({ success: true });
        }),
      );
      const user = userEvent.setup();

      renderWithProviders(<OrganizationSwitcher />);
      await user.click(await screen.findByRole("button", SWITCH_TO_BETA));

      await waitFor(() => expect(mockHardNavigate).toHaveBeenCalledWith("/dashboard"));
      expect(switchBody).toEqual({ organizationId: "org-beta" });
      expect(sessionBody).toEqual({ token: NEW_TOKEN });
      expect(mockHardNavigate).toHaveBeenCalledTimes(1);
    });

    it("recovers through revive when the session cannot be stored (AC-6)", async () => {
      useOrganizations([acme, beta]);
      server.use(
        http.post(SWITCH_URL, () =>
          HttpResponse.json({ status: "success", data: { token: NEW_TOKEN } }),
        ),
        http.post(SESSION_URL, () =>
          HttpResponse.json({ error: "Invalid token" }, { status: 400 }),
        ),
      );
      const user = userEvent.setup();

      renderWithProviders(<OrganizationSwitcher />);
      await user.click(await screen.findByRole("button", SWITCH_TO_BETA));

      await waitFor(() =>
        expect(mockHardNavigate).toHaveBeenCalledWith("/api/auth/revive?returnUrl=%2Fdashboard"),
      );
      expect(mockHardNavigate).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["a 403", () => HttpResponse.json({ status: "fail", message: "Forbidden" }, { status: 403 })],
      ["a network failure", () => HttpResponse.error()],
    ])("stays put and announces an error on %s (AC-7)", async (_label, respond) => {
      useOrganizations([acme, beta]);
      let sessionWrites = 0;
      server.use(
        http.post(SWITCH_URL, respond),
        http.post(SESSION_URL, () => {
          sessionWrites += 1;
          return HttpResponse.json({ success: true });
        }),
      );
      const user = userEvent.setup();

      renderWithProviders(<OrganizationSwitcher />);
      await user.click(await screen.findByRole("button", SWITCH_TO_BETA));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(mockHardNavigate).not.toHaveBeenCalled();
      expect(sessionWrites).toBe(0);
      expect(screen.getByRole("button", SWITCH_TO_BETA)).toBeEnabled();
    });

    it("disables every switch button while a switch is in flight (AC-8)", async () => {
      const gamma = { ...beta, organizationId: "org-gamma", name: "Gamma", slug: "gamma" };
      useOrganizations([acme, beta, gamma]);
      let release: () => void = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      server.use(
        http.post(SWITCH_URL, async () => {
          await held;
          return HttpResponse.json({ status: "success", data: { token: NEW_TOKEN } });
        }),
        http.post(SESSION_URL, () => HttpResponse.json({ success: true })),
      );
      const user = userEvent.setup();

      renderWithProviders(<OrganizationSwitcher />);
      await user.click(await screen.findByRole("button", SWITCH_TO_BETA));

      await waitFor(() => expect(screen.getByRole("button", SWITCH_TO_BETA)).toBeDisabled());
      expect(screen.getByRole("button", { name: "Switch to Gamma" })).toBeDisabled();

      release();

      // Still disabled after the switch settles: the page is about to unload.
      await waitFor(() => expect(mockHardNavigate).toHaveBeenCalled());
      expect(screen.getByRole("button", { name: "Switch to Gamma" })).toBeDisabled();
    });
  });

  describe("accessibility (AC-10)", () => {
    it("has no violations with several organizations", async () => {
      useOrganizations([acme, beta]);

      const { container } = renderWithProviders(<OrganizationSwitcher />);
      await screen.findByRole("button", SWITCH_TO_BETA);

      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations with one organization", async () => {
      useOrganizations([acme]);

      const { container } = renderWithProviders(<OrganizationSwitcher />);
      await screen.findByText("You belong to one organization.");

      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations while loading", async () => {
      useOrganizations([acme, beta]);

      const { container } = renderWithProviders(<OrganizationSwitcher />);

      expect(await axe(container)).toHaveNoViolations();
      await screen.findByRole("list");
    });

    it("has no violations in the error state", async () => {
      server.use(http.get(ORGANIZATIONS_URL, () => listFailure()));

      const { container } = renderWithProviders(<OrganizationSwitcher />);
      await screen.findByRole("button", { name: "Try again" });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations after a failed switch", async () => {
      useOrganizations([acme, beta]);
      server.use(
        http.post(SWITCH_URL, () =>
          HttpResponse.json({ status: "fail", message: "Forbidden" }, { status: 403 }),
        ),
      );
      const user = userEvent.setup();

      const { container } = renderWithProviders(<OrganizationSwitcher />);
      await user.click(await screen.findByRole("button", SWITCH_TO_BETA));
      await screen.findByRole("alert");

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
