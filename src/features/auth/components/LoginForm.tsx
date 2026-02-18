"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";

import { useLoginUserMutation } from "@/features/auth/hooks/login.mutation";
import { authRoutes } from "@/lib/routes";
import { handleApiError } from "@/services/api/handleApiError";
import { loginUserSchema } from "@/types/api/zod-user.schema";
import type { LoginRequestDTO } from "@/types/dtos/user.dto";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import TextField from "@/ui/TextField";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const redirectTarget = useMemo(() => authRoutes.afterAuth(returnUrl), [returnUrl]);

  const { loginUser, isPending, error } = useLoginUserMutation(
    async () => {
      router.push(redirectTarget);
    },
    (err) => {
      console.error("Login Error:", err);
    },
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequestDTO>({
    resolver: zodResolver(loginUserSchema.shape.body),
    mode: "onChange",
  });

  const onValid = useCallback(
    async (data: LoginRequestDTO) => {
      try {
        await loginUser(data);
      } catch {
        // Error state is already surfaced via mutation `error` and `onError` callback.
      }
    },
    [loginUser],
  );

  const onInvalid = useCallback((formErrors: typeof errors) => {
    console.warn("Form has errors, preventing submission.", formErrors);
  }, []);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const submitHandler = handleSubmit(onValid, onInvalid);
      void submitHandler(event);
    },
    [handleSubmit, onValid, onInvalid],
  );

  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);
  const isBusyInputs = isPending || isSubmitting;

  return (
    <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Login</CardTitle>
        <CardDescription>Login using your Lakira Account</CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} className="mb-2" /> : null}

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
              />
            </FormField.Control>
          </FormField>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="mt-4"
            disabled={isBusyInputs}
            block
            aria-label="Login"
          >
            {isBusyInputs ? "Logging In..." : "Log in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
