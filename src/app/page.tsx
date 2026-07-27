import Link from "next/link";

import { authRoutes } from "@/lib/routes";
import Button from "@/ui/Button";

type HomePageProps = {
  searchParams?: Promise<{
    returnUrl?: string;
  }>;
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const returnUrl = resolvedSearchParams.returnUrl;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6">
      {/* Branding */}
      <h1 className="text-center">Lakira</h1>
      <p className="max-w-prose text-center">
        Track and monitor your progress seamlessly. Set goals, view trends, and stay motivated!
      </p>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href={authRoutes.login(returnUrl)}
          aria-label="Login to your account"
          className="w-auto"
        >
          <Button variant="primary">Login</Button>
        </Link>

        <Link
          href={authRoutes.register(returnUrl)}
          aria-label="Create a new account"
          className="w-auto"
        >
          <Button variant="secondary">Register</Button>
        </Link>
      </div>
    </main>
  );
};

export default HomePage;
