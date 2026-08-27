describe("Public home page", () => {
  it("renders branding and auth entry points", () => {
    const visibleAssertion = "be.visible";

    cy.visit("/");

    // Assert on structure, not brand copy — renaming a fork must not break e2e.
    cy.get("h1").should(visibleAssertion).and("not.be.empty");

    cy.get('a[aria-label="Login to your account"]')
      .should(visibleAssertion)
      .and("have.attr", "href")
      .and("include", "/login");

    cy.get('a[aria-label="Create a new account"]')
      .should(visibleAssertion)
      .and("have.attr", "href")
      .and("include", "/register");
  });
});
