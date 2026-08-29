"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useForgotPasswordMutation } from "@/features/auth/hooks/forgot-password.mutation";
import { authRoutes } from "@/lib/routes";
import { handleApiError } from "@/services/api/handleApiError";
import type { ForgotPasswordInput } from "@/types/api/zod-user.schema";
import { forgotPasswordSchema } from "@/types/api/zod-user.schema";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import TextField from "@/ui/TextField";

const ForgotPasswordForm = () => {
  const { mutate, isPending, isSuccess, error } = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);
  const isBusyInputs = isPending || isSubmitting;

  // handleSubmit returns a promise; passing it straight to onSubmit trips
  // @typescript-eslint/no-misused-promises. Wrap it in a sync handler.
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit((values) => {
      mutate(values.email);
    })(event);
  };

  // Shown whether or not the address exists. The backend answers identically in
  // both cases, and branching here would leak which accounts are real.
  if (isSuccess) {
    return (
      <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for that address, a reset link is on its way. The link expires
            shortly, so use it soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href={authRoutes.login()} aria-label="Back to login" className="w-auto">
            <Button variant="secondary">Back to login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter the email address on your account and we will send you a reset link.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} className="mb-2" /> : null}

          <FormField invalid={!!errors.email} error={errors.email?.message}>
            <FormField.Label>Email</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="e.g., john.doe@example.com"
                registration={register("email")}
                hasError={!!errors.email}
                disabled={isBusyInputs}
                clearable
                required
              />
            </FormField.Control>
          </FormField>

          <Button type="submit" variant="primary" disabled={isBusyInputs}>
            {isPending ? "Sending…" : "Send reset link"}
          </Button>

          <Link
            href={authRoutes.login()}
            aria-label="Back to login"
            className="w-auto self-center"
          >
            <Button variant="ghost" type="button">
              Back to login
            </Button>
          </Link>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
