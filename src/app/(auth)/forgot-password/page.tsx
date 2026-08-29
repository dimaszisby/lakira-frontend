import type { Metadata } from "next";

import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
};

const ForgotPasswordPage = () => <ForgotPasswordForm />;

export default ForgotPasswordPage;
