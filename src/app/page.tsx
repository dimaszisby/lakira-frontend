import Link from "next/link";

import Button from "../components/ui/Button";

const HomePage = () => {
  return (
    <main className=" flex min-h-dvh flex-col items-center justify-center gap-6">
      {/* Branding */}
      <h1 className="">Welcome to Lakira</h1>
      <p className="max-w-prose text-center">
        Track and monitor your progress seamlessly. Set goals, view trends, and stay motivated!
      </p>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/login" aria-label="Login to your account" className="w-auto">
          <Button variant="primary">Login</Button>
        </Link>

        <Link href="/register" aria-label="Create a new account" className="w-auto">
          <Button variant="secondary">Register</Button>
        </Link>
      </div>
    </main>
  );
};

export default HomePage;
