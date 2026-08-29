import type { Metadata } from "next";

import VerifyEmailPanel from "@/features/auth/components/VerifyEmailPanel";

export const metadata: Metadata = {
  title: "Verify email",
};

type Props = {
  // See the searchParams note in reset-password/page.tsx.
  searchParams?: Promise<{ token?: string }>;
};

const VerifyEmailPage = async ({ searchParams }: Props) => {
  const resolved = (await searchParams) ?? {};
  return <VerifyEmailPanel token={resolved.token ?? ""} />;
};

export default VerifyEmailPage;
