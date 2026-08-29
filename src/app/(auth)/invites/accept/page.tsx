import type { Metadata } from "next";

import AcceptInvitePanel from "@/features/organizations/components/AcceptInvitePanel";

export const metadata: Metadata = {
  title: "Accept invitation",
};

type Props = {
  // Next 16 delivers searchParams as a Promise. Destructuring it synchronously
  // is a logged incident here:
  // docs/internal/incidents/fix-searchParams-and-cookies-20251130.md
  searchParams?: Promise<{ token?: string }>;
};

const AcceptInvitePage = async ({ searchParams }: Props) => {
  const resolved = (await searchParams) ?? {};
  return <AcceptInvitePanel token={resolved.token ?? ""} />;
};

export default AcceptInvitePage;
