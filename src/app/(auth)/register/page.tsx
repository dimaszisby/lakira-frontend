import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import RegisterForm from "@/features/auth/components/RegisterForm";
import { authRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Register - Lakira",
};

type RegisterPageProps = {
  searchParams?: {
    returnUrl?: string;
  };
};

const RegisterPage = ({ searchParams }: RegisterPageProps) => {
  const token = cookies().get("lakira_token");

  if (token?.value) {
    redirect(authRoutes.afterAuth(searchParams?.returnUrl));
  }

  return <RegisterForm />;
};

export default RegisterPage;
