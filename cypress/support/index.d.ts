export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsTestUser(args?: {
        email?: string;
        password?: string;
      }): Chainable<Response<unknown>>;
      setInvalidAuthToken(token?: string): Chainable<Response<unknown>>;
    }
  }
}
