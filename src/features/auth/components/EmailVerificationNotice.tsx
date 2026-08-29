"use client";

import { useMemo } from "react";

import { useResendVerificationMutation } from "@/features/auth/hooks/resend-verification.mutation";
import { handleApiError } from "@/services/api/handleApiError";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";

type Props = {
  /** When the address was confirmed, or null while unverified. */
  emailVerifiedAt: string | null | undefined;
};

/**
 * Prompts an unverified user to confirm their address.
 *
 * The backend gates parts of the product on verification, so without this a
 * user whose verification email was lost had no in-app way to recover — the
 * only route back was a link they no longer had.
 *
 * Renders nothing once the address is verified.
 */
const EmailVerificationNotice = ({ emailVerifiedAt }: Props) => {
  const { mutate, isPending, isSuccess, error } = useResendVerificationMutation();
  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);

  if (emailVerifiedAt) return null;

  return (
    <Card variant="primary" size="md">
      <CardHeader>
        <CardTitle>Confirm your email address</CardTitle>
        <CardDescription>
          Some features stay locked until your address is verified. Check your inbox for the link,
          or send yourself a new one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} /> : null}

        {isSuccess ? (
          <p className="text-body2">
            Sent. Give it a minute or two, and check your spam folder if it does not arrive.
          </p>
        ) : (
          <Button
            variant="primary"
            disabled={isPending}
            onClick={() => mutate()}
            aria-label="Resend the verification email"
            className="self-start"
          >
            {isPending ? "Sending…" : "Resend verification email"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailVerificationNotice;
