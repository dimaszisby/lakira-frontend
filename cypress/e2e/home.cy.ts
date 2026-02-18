describe("Public home page", () => {
  it("renders branding and auth entry points", () => {
    const visibleAssertion = "be.visible";

    cy.visit("/");

    cy.contains("h1", "Lakira").should(visibleAssertion);
    cy.contains("Track and monitor your progress seamlessly").should(visibleAssertion);

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
