import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import LoginForm from "@/features/auth/components/LoginForm";
import { authRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Login - Lakira",
};

type LoginPageProps = {
  searchParams?: {
    returnUrl?: string;
  };
};

const LoginPage = ({ searchParams }: LoginPageProps) => {
  const token = cookies().get("lakira_token");

  if (token?.value) {
    redirect(authRoutes.afterAuth(searchParams?.returnUrl));
  }

  return <LoginForm />;
};

export default LoginPage;
