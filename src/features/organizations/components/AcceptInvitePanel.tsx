"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { useAcceptInviteMutation } from "@/features/organizations/hooks/accept-invite.mutation";
import { authRoutes } from "@/lib/routes";
import { handleApiError } from "@/services/api/handleApiError";
import Button from "@/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import ErrorMessage from "@/ui/ErrorMessage";

type Props = {
  /** Invitation token from the emailed link. */
  token: string;
};

const AcceptInvitePanel = ({ token }: Props) => {
  const { mutate, isPending, isSuccess, error } = useAcceptInviteMutation();
  const attempted = useRef(false);

  useEffect(() => {
    // Single-use token, and React Strict Mode mounts effects twice in
    // development — a second call would spend a token that already worked.
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
            The invitation link is missing its token. Ask for a fresh invitation.
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
          {isPending
            ? "Accepting your invitation…"
            : isSuccess
              ? "You're in"
              : "That invitation did not work"}
        </CardTitle>
        <CardDescription>
          {isPending
            ? "This only takes a moment."
            : isSuccess
              ? // The membership is on the next token, not the current one.
                "Sign in again to start working in your new organization."
              : "The invitation may have expired or already been used."}
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

export default AcceptInvitePanel;
