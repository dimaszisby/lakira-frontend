import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/constants/app";
import RegisterForm from "@/features/auth/components/RegisterForm";
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
  const token = cookieStore.get(SESSION_COOKIE_NAME);

  if (token?.value) {
    redirect(authRoutes.afterAuth(resolvedSearchParams.returnUrl));
  }

  return <RegisterForm />;
};

export default RegisterPage;
