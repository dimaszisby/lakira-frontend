import { screen } from "@testing-library/react";

import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// WCAG 1.3.5 Identify Input Purpose: fields collecting the user's own details say what they are.
// axe only validates a token that is present, so nothing else catches a missing one.
// docs/internal/todos/2026-09-29-todo-auth-fields-missing-autocomplete.md
const AUTOCOMPLETE = "autocomplete";
const NEW_PASSWORD = "new-password";

const expectEmailField = (label: string) => {
  const field = screen.getByLabelText(label);
  expect(field).toHaveAttribute(AUTOCOMPLETE, "email");
  // The forms set noValidate, so this changes the mobile keyboard, not validation.
  expect(field).toHaveAttribute("type", "email");
};

describe("auth forms declare their fields' purpose", () => {
  it("marks the login email and current password", () => {
    renderWithProviders(<LoginForm />);

    expectEmailField("Email");
    expect(screen.getByLabelText("Password")).toHaveAttribute(AUTOCOMPLETE, "current-password");
  });

  it("marks the registration handle, email and new password", () => {
    renderWithProviders(<RegisterForm />);

    // The handle is not what anyone signs in with, so it is not `username`: a password manager
    // would store it as the login and later fill it into the login form's email field.
    expect(screen.getByLabelText("Username")).toHaveAttribute(AUTOCOMPLETE, "nickname");
    expectEmailField("Email");
    expect(screen.getByLabelText("Password")).toHaveAttribute(AUTOCOMPLETE, NEW_PASSWORD);
    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute(AUTOCOMPLETE, NEW_PASSWORD);
  });

  it("marks the forgot-password email", () => {
    renderWithProviders(<ForgotPasswordForm />);

    expectEmailField("Email");
  });

  it("marks both reset-password fields as a new password", () => {
    renderWithProviders(<ResetPasswordForm token="plain-reset-token" />);

    expect(screen.getByLabelText("New password")).toHaveAttribute(AUTOCOMPLETE, NEW_PASSWORD);
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute(
      AUTOCOMPLETE,
      NEW_PASSWORD,
    );
  });
});
