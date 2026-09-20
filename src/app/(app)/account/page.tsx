"use client";

import { useMemo } from "react";

import { withAuth } from "@/components/hoc/withAuth";
import { APP_NAME } from "@/constants/app";
import EmailVerificationNotice from "@/features/auth/components/EmailVerificationNotice";
import { useAuthProfileQuery } from "@/features/auth/hooks/profile.query";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { ThemeSwitcher } from "@/ui/ThemeSwitcher";

const AccountPageBase = () => {
  const { data, isLoading, isFetching, isError, error, refetch } = useAuthProfileQuery();

  const profileError = useMemo(() => {
    if (!isError) return undefined;
    return error instanceof Error ? error.message : "Unable to load your profile.";
  }, [error, isError]);

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
    </section>
  );
};

const AccountPage = withAuth(AccountPageBase);

export default AccountPage;
