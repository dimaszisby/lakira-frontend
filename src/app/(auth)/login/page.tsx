import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import LoginForm from "@/features/auth/components/LoginForm";
import { authRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams?: Promise<{
    returnUrl?: string;
  }>;
};

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME);

  if (token?.value) {
    redirect(authRoutes.afterAuth(resolvedSearchParams.returnUrl));
  }

  return <LoginForm />;
};

export default LoginPage;
