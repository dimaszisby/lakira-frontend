"use client";

import { useMemo } from "react";

import SignOutControl from "@/components/layout/SignOutControl";
import { APP_NAME } from "@/constants/app";
import EmailVerificationNotice from "@/features/auth/components/EmailVerificationNotice";
import { useAuthProfileQuery } from "@/features/auth/hooks/profile.query";
import { handleApiError } from "@/services/api/handleApiError";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { ThemeSwitcher } from "@/ui/ThemeSwitcher";

import { useSignOut } from "../_components/useSignOut";

const AccountPage = () => {
  const { data, isLoading, isFetching, isError, error, refetch } = useAuthProfileQuery();
  const { signOut, isSigningOut } = useSignOut();

  const profileError = useMemo(
    () => (isError ? handleApiError(error).join(", ") : undefined),
    [error, isError],
  );

  if (isLoading && !data) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center">
        <p className="text-base text-ink-secondary" aria-live="polite">
          Loading your account&hellip;
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>We were unable to load your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileError ? <ErrorMessage message={profileError} /> : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              {isFetching ? "Refreshing…" : "Try again"}
            </Button>
            {/* A failing profile can mean a failing session: signing out must still be possible
                below `lg`, where this page is the only place to do it (kit `mobile-sign-out`). */}
            <SignOutControl onSignOut={signOut} isSigningOut={isSigningOut} className="w-auto" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Account</h1>
        <p className="text-sm text-ink-secondary">
          View your profile details and manage your account visibility.
        </p>
      </header>

      <EmailVerificationNotice emailVerifiedAt={data.emailVerifiedAt} />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Basic account information pulled from your {APP_NAME} account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-surface2 text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-secondary">Username</dt>
              <dd className="font-medium text-ink">{data.username}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-secondary">Email</dt>
              <dd className="font-medium text-ink">{data.email}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-secondary">Role</dt>
              <dd className="font-medium capitalize text-ink">{data.role}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-secondary">Profile Visibility</dt>
              <dd className="font-medium text-ink">
                {data.isPublicProfile ? "Public" : "Private"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              {isFetching ? "Refreshing…" : "Refresh profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose how {APP_NAME} looks. The choice is remembered on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      {/* Below `lg` this is the only way to sign out; the bottom bar's Account tab leads here
          (kit `mobile-sign-out`, D-01). On desktop the sidebar has the same control. */}
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of {APP_NAME} on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutControl onSignOut={signOut} isSigningOut={isSigningOut} className="w-auto" />
        </CardContent>
      </Card>
    </section>
  );
};

export default AccountPage;
