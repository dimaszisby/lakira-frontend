import { newUser, preflightStack, registerUser, tokenFor } from "../../support/stack";

// AC-6 of cypress-a11y-e2e. Needs the local stack: `npm run test:e2e:stack`.
const NEW_PASSWORD = "e2e-stack-password-new";

describe("Resetting a forgotten password", () => {
  const user = newUser("reset");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  it("sets a new password from the emailed link", () => {
    cy.visitInTheme("/forgot-password", "light");
    cy.get('input[name="email"]').type(user.email);
    cy.get('button[type="submit"]').click();
    cy.contains("Check your email").should("be.visible");

    tokenFor(user.email, "reset").then((token) => {
      cy.visitInTheme(`/reset-password?token=${encodeURIComponent(token)}`, "light");
    });
    cy.get('input[name="password"]').type(NEW_PASSWORD);
    cy.get('input[name="passwordConfirmation"]').type(NEW_PASSWORD);
    cy.get('button[type="submit"]').click();
    cy.contains("Password updated").should("be.visible");
    cy.checkPageA11y("reset password, success (light)");

    const login = (password: string) =>
      cy.request({
        method: "POST",
        url: "/api/proxy/auth/login",
        body: { email: user.email, password },
        failOnStatusCode: false,
      });
    login(NEW_PASSWORD).its("status").should("eq", 200);
    login(user.password).its("status").should("eq", 401);
  });
});
