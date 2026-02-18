"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";

import { useRegisterUserMutation } from "@/features/auth/hooks/register.mutation";
import { authRoutes } from "@/lib/routes";
import { handleApiError } from "@/services/api/handleApiError";
import { createUserSchema } from "@/types/api/zod-user.schema";
import type { CreateUserRequestDTO } from "@/types/dtos/user.dto";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import TextField from "@/ui/TextField";

const RegisterForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const redirectTarget = useMemo(() => authRoutes.afterAuth(returnUrl), [returnUrl]);

  const { registerUser, isPending, error } = useRegisterUserMutation(
    async () => {
      router.push(redirectTarget);
    },
    (err) => {
      console.error("Register Error:", err);
    },
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
  } = useForm<CreateUserRequestDTO>({
    resolver: zodResolver(createUserSchema.shape.body),
    mode: "onChange",
  });

  // Watch password and passwordConfirmation for live validation
  const password = watch("password");
  const passwordConfirmation = watch("passwordConfirmation");

  const onValid = useCallback(
    async (data: CreateUserRequestDTO) => {
      // Dev Note: We are setting the `isPublicProfile` to `true` by default
      // Public profile will be implemented in a future release
      const finalData: CreateUserRequestDTO = {
        ...data,
        isPublicProfile: true,
      };
      try {
        await registerUser(finalData);
      } catch {
        // Error state is already surfaced via mutation `error` and `onError` callback.
      }
    },
    [registerUser],
  );

  const onInvalid = useCallback((formErrors: typeof errors) => {
    console.warn("Form has errors, preventing submission.", formErrors);
  }, []);

  const onSubmitForm = useMemo(
    () => handleSubmit(onValid, onInvalid),
    [handleSubmit, onValid, onInvalid],
  );

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      void onSubmitForm(e);
    },
    [onSubmitForm],
  );

  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);
  const isBusyInputs = isPending || isSubmitting;
  const passwordsMismatch = !!(passwordConfirmation && password !== passwordConfirmation);

  return (
    <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Register</CardTitle>
        <CardDescription>Create your Lakira Account</CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} className="mb-4" /> : null}

          {/* Username Field */}
          <FormField invalid={!!errors.username} error={errors.username?.message}>
            <FormField.Label>Username</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="e.g., john.doe"
                registration={register("username")}
                hasError={!!errors.username}
                disabled={isBusyInputs}
                clearable
                required
              />
            </FormField.Control>
          </FormField>

          {/* Email Field */}
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
                type="email"
              />
            </FormField.Control>
          </FormField>

          {/* Password Field */}
          <FormField invalid={!!errors.password} error={errors.password?.message}>
            <FormField.Label>Password</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="Enter your password"
                registration={register("password")}
                hasError={!!errors.password}
                disabled={isBusyInputs}
                clearable
                required
                type="password"
                autoComplete="new-password"
              />
            </FormField.Control>
          </FormField>

          {/* Confirm Password Field */}
          <FormField
            invalid={Boolean(errors.passwordConfirmation) || passwordsMismatch}
            error={
              errors.passwordConfirmation?.message ||
              (passwordsMismatch ? "Passwords do not match" : undefined)
            }
          >
            <FormField.Label>Confirm Password</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="Confirm your password"
                registration={register("passwordConfirmation")}
                hasError={Boolean(errors.passwordConfirmation) || passwordsMismatch}
                disabled={isBusyInputs}
                clearable
                required
                type="password"
                autoComplete="new-password"
              />
            </FormField.Control>
          </FormField>

          <Button
            type="submit"
            variant="primary"
            disabled={isBusyInputs || !isValid || passwordsMismatch}
            className="mt-4"
            block
            aria-label="Register"
          >
            {isBusyInputs ? "Registering..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
