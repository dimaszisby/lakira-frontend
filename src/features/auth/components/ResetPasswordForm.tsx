"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useResetPasswordMutation } from "@/features/auth/hooks/reset-password.mutation";
import { authRoutes } from "@/lib/routes";
import { handleApiError } from "@/services/api/handleApiError";
import type { ResetPasswordInput } from "@/types/api/zod-user.schema";
import { resetPasswordSchema } from "@/types/api/zod-user.schema";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import TextField from "@/ui/TextField";

type Props = {
  /** Reset token from the emailed link. */
  token: string;
};

const ResetPasswordForm = ({ token }: Props) => {
  const router = useRouter();
  const { mutate, isPending, isSuccess, error } = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);
  const isBusyInputs = isPending || isSubmitting;

  // See the note in ForgotPasswordForm: onSubmit must receive a sync handler.
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit((values) => {
      mutate({ ...values, token });
    })(event);
  };

  // A missing token means the link was mistyped or truncated. Say so rather
  // than showing a form that cannot succeed.
  if (!token) {
    return (
      <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>This link is not valid</CardTitle>
          <CardDescription>
            The reset link is missing its token. Request a new one and use the most recent email.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href={authRoutes.forgotPassword()} aria-label="Request a new reset link">
            <Button variant="primary">Request a new link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Password updated</CardTitle>
          <CardDescription>Sign in with your new password.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button variant="primary" onClick={() => router.push(authRoutes.login())}>
            Go to login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Pick something you have not used here before.</CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} className="mb-2" /> : null}

          <FormField invalid={!!errors.password} error={errors.password?.message}>
            <FormField.Label>New password</FormField.Label>
            <FormField.Control>
              <TextField
                type="password"
                placeholder="At least 6 characters"
                registration={register("password")}
                hasError={!!errors.password}
                disabled={isBusyInputs}
                required
              />
            </FormField.Control>
          </FormField>

          <FormField
            invalid={!!errors.passwordConfirmation}
            error={errors.passwordConfirmation?.message}
          >
            <FormField.Label>Confirm new password</FormField.Label>
            <FormField.Control>
              <TextField
                type="password"
                placeholder="Repeat the new password"
                registration={register("passwordConfirmation")}
                hasError={!!errors.passwordConfirmation}
                disabled={isBusyInputs}
                required
              />
            </FormField.Control>
          </FormField>

          <Button type="submit" variant="primary" disabled={isBusyInputs}>
            {isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
