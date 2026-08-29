"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { useVerifyEmailMutation } from "@/features/auth/hooks/verify-email.mutation";
import { authRoutes } from "@/lib/routes";
import { handleApiError } from "@/services/api/handleApiError";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";

type Props = {
  /** Verification token from the emailed link. */
  token: string;
};

const VerifyEmailPanel = ({ token }: Props) => {
  const { mutate, isPending, isSuccess, error } = useVerifyEmailMutation();
  const attempted = useRef(false);

  useEffect(() => {
    // The token is single-use. React 18 mounts effects twice in development
    // Strict Mode, and a second call would spend a token that already worked
    // and render a spurious failure — so guard the attempt.
    if (!token || attempted.current) return;
    attempted.current = true;
    mutate(token);
  }, [token, mutate]);

  const serverErrorMsg = useMemo(() => (error ? handleApiError(error).join(", ") : ""), [error]);

  if (!token) {
    return (
      <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>This link is not valid</CardTitle>
          <CardDescription>
            The verification link is missing its token. Sign in and request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href={authRoutes.login()} aria-label="Go to login">
            <Button variant="primary">Go to login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="primary" size="md" className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>
          {isPending ? "Verifying your email…" : isSuccess ? "Email verified" : "Verification failed"}
        </CardTitle>
        <CardDescription>
          {isPending
            ? "This only takes a moment."
            : isSuccess
              ? "Your address is confirmed. You can sign in now."
              : "The link may have expired or already been used."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4">
        {serverErrorMsg ? <ErrorMessage message={serverErrorMsg} /> : null}

        {!isPending ? (
          <Link href={authRoutes.login()} aria-label="Go to login">
            <Button variant={isSuccess ? "primary" : "secondary"}>Go to login</Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default VerifyEmailPanel;
