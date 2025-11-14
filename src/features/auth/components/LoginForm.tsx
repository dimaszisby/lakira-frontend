"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";

import { useLoginUserMutation } from "@/src/features/auth/hooks/login.mutation";
import { cn } from "@/src/lib/cn";
import { handleApiError } from "@/src/services/api/handleApiError";
import type { LoginRequestDTO } from "@/src/types/dtos/user.dto";
import { loginUserSchema } from "@/types/api/zod-user.schema";
import Button from "@/ui/Button";
import Card from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import TextField from "@/ui/TextField";

const LoginForm = () => {
  const router = useRouter();

  const { loginUser, isPending, error } = useLoginUserMutation(
    async () => {
      router.push("/dashboard");
    },
    (err) => {
      console.error("Login Error:", err);
    },
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginRequestDTO>({
    resolver: zodResolver(loginUserSchema.shape.body),
    mode: "onChange",
  });

  const onValid = useCallback(
    async (data: LoginRequestDTO) => {
      await loginUser(data);
    },
    [loginUser],
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

  return (
    <Card variant="secondary" className="mx-auto">
      <form noValidate onSubmit={handleFormSubmit} className="flex-row space-y-6">
        <h1 className={cn("text-h1", "text-center")}>Login</h1>

        <p className={cn("block text-center")}>Login using your Lakira Account</p>

        {/* Display Server Error Messages */}
        {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} className="mb-4" /> : null}

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
        <Button type="submit" variant="primary" disabled={isBusyInputs || !isValid} block>
          {isBusyInputs ? "Logging In..." : "Log in"}
        </Button>
      </form>
    </Card>
  );
};

export default LoginForm;
