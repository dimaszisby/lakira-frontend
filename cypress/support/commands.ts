type LoginArgs = {
  email: string;
  password: string;
};

function getEnvCredential(key: string) {
  const value = Cypress.env(key);
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

Cypress.Commands.add("loginAsTestUser", (args?: Partial<LoginArgs>) => {
  const email = args?.email ?? getEnvCredential("E2E_USER_EMAIL");
  const password = args?.password ?? getEnvCredential("E2E_USER_PASSWORD");

  if (!email || !password) {
    throw new Error(
      "Missing E2E credentials. Provide { email, password } or set E2E_USER_EMAIL/E2E_USER_PASSWORD.",
    );
  }

  return cy
    .request({
      method: "POST",
      url: "/api/auth/login",
      body: { email, password },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status >= 400) {
        throw new Error(`E2E login failed with status ${response.status}`);
      }
      return response;
    });
});

Cypress.Commands.add("setInvalidAuthToken", (token = "invalid.token.for.e2e") => {
  return cy.request({
    method: "POST",
    url: "/api/auth/session",
    body: { token },
    failOnStatusCode: false,
  });
});
