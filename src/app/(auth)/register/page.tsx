import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import RegisterForm from "@/features/auth/components/RegisterForm";
import { isSessionTokenUsable } from "@/lib/jwt";
import { authRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Register",
};

type RegisterPageProps = {
  searchParams?: Promise<{
    returnUrl?: string;
  }>;
};

const RegisterPage = async ({ searchParams }: RegisterPageProps) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Presence is not usability. Redirecting on a cookie that merely exists trapped
  // anyone holding a token the backend rejects: every call 401'd, and "log in
  // again" bounced straight back to the dashboard without ever showing the form.
  // `isSessionTokenUsable` is the same check `src/proxy.ts` makes.
  if (isSessionTokenUsable(token)) {
    redirect(authRoutes.afterAuth(resolvedSearchParams.returnUrl));
  }

  return <RegisterForm />;
};

export default RegisterPage;
