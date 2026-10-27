import { screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import MemberList from "@/features/organizations/components/MemberList";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

const MEMBERS_URL = `*/organizations/${TEST_ORGANIZATION_ID}/members`;

const member = {
  membershipId: "mem-1",
  userId: "u-1",
  username: "ada",
  email: "ada@example.com",
  role: "owner" as const,
  status: "active" as const,
  joinedAt: "2026-08-01T10:00:00Z",
};

const grace = {
  ...member,
  membershipId: "mem-2",
  userId: "u-2",
  username: "grace",
  email: "grace@example.com",
  role: "member" as const,
};

const membersPage = (members: unknown[], nextCursor: string | null) =>
  HttpResponse.json({ status: "success", message: "Success", data: { members, nextCursor } });

describe("MemberList", () => {
  it("renders members returned for the active organization", async () => {
    server.use(
      http.get(MEMBERS_URL, () =>
        HttpResponse.json({ status: "success", message: "Success", data: { members: [member] } }),
      ),
    );

    renderWithProviders(<MemberList />);

    expect(await screen.findByText("ada")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("requests the active organization, not a hardcoded one", async () => {
    // The request URL is the observable proof that the org id reached the API
    // layer. A regression that dropped it would 404 rather than fetch another
    // tenant, but it would still be a scoping failure.
    let requestedUrl = "";
    server.use(
      http.get("*/organizations/:organizationId/members", ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          status: "success",
          message: "Success",
          data: { members: [] },
        });
      }),
    );

    renderWithProviders(<MemberList />);

    await waitFor(() => expect(requestedUrl).toContain(TEST_ORGANIZATION_ID));
  });

  it("lists members from every page when the list runs past one page", async () => {
    // The backend answers at most 100 rows a page since lakira-backend #218;
    // the list follows nextCursor until it is null (register row F-76).
    const afters: (string | null)[] = [];
    server.use(
      http.get(MEMBERS_URL, ({ request }) => {
        const after = new URL(request.url).searchParams.get("after");
        afters.push(after);
        return after === "page-2" ? membersPage([grace], null) : membersPage([member], "page-2");
      }),
    );

    const { container } = renderWithProviders(<MemberList />);

    expect(await screen.findByText("grace")).toBeInTheDocument();
    expect(screen.getByText("ada")).toBeInTheDocument();
    expect(afters).toEqual([null, "page-2"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("stops following when the backend repeats a cursor", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const afters: (string | null)[] = [];
    server.use(
      http.get(MEMBERS_URL, ({ request }) => {
        const after = new URL(request.url).searchParams.get("after");
        afters.push(after);
        return after === "page-2"
          ? membersPage([grace], "page-2")
          : membersPage([member], "page-2");
      }),
    );

    renderWithProviders(<MemberList />);

    expect(await screen.findByText("grace")).toBeInTheDocument();
    expect(screen.getByText("ada")).toBeInTheDocument();
    expect(afters).toEqual([null, "page-2"]);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("shows an empty state when the organization has no members", async () => {
    server.use(
      http.get(MEMBERS_URL, () =>
        HttpResponse.json({ status: "success", message: "Success", data: { members: [] } }),
      ),
    );

    renderWithProviders(<MemberList />);

    expect(await screen.findByText("No members yet.")).toBeInTheDocument();
  });

  it("surfaces a server error instead of rendering an empty table", async () => {
    server.use(
      http.get(MEMBERS_URL, () =>
        HttpResponse.json({ status: "fail", message: "Forbidden" }, { status: 403 }),
      ),
    );

    renderWithProviders(<MemberList />);

    await waitFor(() => expect(screen.queryByText("No members yet.")).not.toBeInTheDocument());
  });

  it("has no accessibility violations", async () => {
    server.use(
      http.get(MEMBERS_URL, () =>
        HttpResponse.json({ status: "success", message: "Success", data: { members: [member] } }),
      ),
    );

    const { container } = renderWithProviders(<MemberList />);
    await screen.findByText("ada");

    expect(await axe(container)).toHaveNoViolations();
  });
});
