import { newUser, preflightStack, registerUser, signIn, tokenFor } from "../../support/stack";

// AC-6 of cypress-a11y-e2e: the journey checked by hand for org-switcher AC-5 on 2026-09-29.
// Needs the local stack: `npm run test:e2e:stack`.
type OrganizationsBody = {
  data: { organizations: { organizationId: string; name: string; isCurrent: boolean }[] };
};

const THEME = "light";
const ORGANIZATION_PAGE = "/organization";

describe("Joining and switching organizations", () => {
  const owner = newUser("owner");
  const member = newUser("member");

  before(() => {
    preflightStack();
    registerUser(owner);
    registerUser(member);
  });

  it("lets a member accept an emailed invite and switch into the inviting organization", () => {
    signIn(owner);
    cy.request<OrganizationsBody>("/api/proxy/organizations").then(({ body }) => {
      const current = body.data.organizations.find((organization) => organization.isCurrent);
      expect(current, "the owner's current organization").to.exist;
      cy.wrap(current?.name).as("organizationName");
    });

    cy.visitInTheme(ORGANIZATION_PAGE, THEME);
    cy.contains("form", "Send invitation").within(() => {
      cy.get('input[name="email"]').type(member.email);
      cy.contains("button", "Send invitation").click();
    });
    cy.contains("Invitation sent.").should("be.visible");

    cy.clearCookies();
    signIn(member);
    tokenFor(member.email, "invite").then((token) => {
      cy.visitInTheme(`/invites/accept?token=${encodeURIComponent(token)}`, THEME);
    });
    cy.contains("You're in").should("be.visible");
    cy.checkPageA11y("accept invite, success (light)");

    cy.visitInTheme(ORGANIZATION_PAGE, THEME);
    cy.checkPageA11y("organization, two memberships (light)");
    cy.get<string>("@organizationName").then((name) => {
      cy.contains("button", `to ${name}`).click();
      cy.location("pathname").should("eq", "/dashboard");

      cy.visitInTheme(ORGANIZATION_PAGE, THEME);
      cy.contains("li", name).should("contain.text", "Current");
    });
  });
});
