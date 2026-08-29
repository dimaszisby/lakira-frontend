import type { Metadata } from "next";

import InviteMemberForm from "@/features/organizations/components/InviteMemberForm";
import MemberList from "@/features/organizations/components/MemberList";

export const metadata: Metadata = {
  title: "Organization",
};

const OrganizationPage = () => (
  <section className="mx-auto flex max-w-3xl flex-col gap-6">
    <header>
      <h1 className="text-3xl font-semibold text-ink">Organization</h1>
      <p className="text-ink-muted text-sm">Manage who has access and what they can do.</p>
    </header>

    <MemberList />
    <InviteMemberForm />
  </section>
);

export default OrganizationPage;
