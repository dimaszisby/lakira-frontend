"use client";

import { useMemo } from "react";

import { useMyOrganizations } from "@/features/organizations/hooks/my-organizations.query";
import { useSwitchOrganizationMutation } from "@/features/organizations/hooks/switch-organization.mutation";
import { handleApiError } from "@/services/api/handleApiError";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { SkeletonLoader } from "@/ui/SkeletonLoader";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const toMessage = (error: Error | null) => (error ? handleApiError(error).join(", ") : "");

/**
 * The organizations the signed-in user belongs to, with a switch to each one
 * they are not currently acting in.
 *
 * A successful switch reloads the page into `/dashboard`, so this component
 * never renders the "after" state; see `useSwitchOrganizationMutation`.
 */
const OrganizationSwitcher = () => {
  const { data, isPending, error, refetch, isRefetching } = useMyOrganizations();
  const switchOrganization = useSwitchOrganizationMutation();

  const listError = useMemo(() => toMessage(error), [error]);
  const switchError = useMemo(
    () => toMessage(switchOrganization.error),
    [switchOrganization.error],
  );

  const organizations = data?.organizations ?? [];
  // Success counts too: the mutation settles before the page unloads, and the
  // buttons must not come back to life in that gap (AC-8).
  const isSwitching = switchOrganization.isPending || switchOrganization.isSuccess;
  const hasOnlyOne = organizations.length === 1;

  return (
    <Card variant="primary" size="md">
      <CardHeader>
        <CardTitle>Your organizations</CardTitle>
        <CardDescription>
          {hasOnlyOne
            ? "You belong to one organization."
            : "Switch to another organization you belong to."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {switchError ? <ErrorMessage message={switchError} className="mb-2" /> : null}

        {isPending ? <SkeletonLoader /> : null}

        {listError ? (
          <div className="flex flex-col items-start gap-2">
            <ErrorMessage message={listError} />
            <Button
              variant="secondary"
              size="sm"
              loading={isRefetching}
              onClick={() => {
                void refetch();
              }}
            >
              Try again
            </Button>
          </div>
        ) : null}

        {organizations.length > 0 ? (
          // role="list" is not redundant: Tailwind's preflight removes list styling,
          // and Safari + VoiceOver then drop list semantics. See accessibility.md.
          <ul role="list" className="flex flex-col divide-y divide-surface2">
            {organizations.map((organization) => (
              <li
                key={organization.organizationId}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium text-ink">{organization.name}</span>
                  <span className="block text-sm text-ink-secondary">
                    {ROLE_LABEL[organization.role] ?? organization.role}
                    {organization.isCurrent ? " · Current" : null}
                  </span>
                </div>

                {organization.isCurrent ? null : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSwitching}
                    loading={
                      isSwitching
                        ? switchOrganization.variables === organization.organizationId
                        : false
                    }
                    onClick={() => switchOrganization.mutate(organization.organizationId)}
                  >
                    Switch<span className="sr-only"> to {organization.name}</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default OrganizationSwitcher;
