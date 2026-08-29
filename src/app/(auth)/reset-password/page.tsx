import type { Metadata } from "next";

import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password",
};

type Props = {
  // Next 16 delivers searchParams as a Promise. Destructuring it synchronously
  // is a logged incident in this repo, not a hypothetical:
  // docs/internal/incidents/fix-searchParams-and-cookies-20251130.md
  searchParams?: Promise<{ token?: string }>;
};

const ResetPasswordPage = async ({ searchParams }: Props) => {
  const resolved = (await searchParams) ?? {};
  return <ResetPasswordForm token={resolved.token ?? ""} />;
};

export default ResetPasswordPage;
