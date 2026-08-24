"use client";

import { useAtom } from "jotai";
import Link from "next/link";

import { APP_NAME } from "@/constants/app";
import { userAtom } from "@/services/state/atoms";
import Card from "@/ui/Card";

const Header = () => {
  const [user] = useAtom(userAtom);

  return (
    <>
      {user ? null : (
        <Card variant="primary" size="xs" className="m-4">
          <header>
            <nav className="flex w-full items-center justify-between">
              <Link href="/" className="text-h5 font-bold text-brand-primary">
                {APP_NAME}
              </Link>

              <div className="text-nav-item flex flex-row gap-12">
                <Link href="/login">Login</Link>
                <Link href="/register">Register</Link>
              </div>
            </nav>
          </header>
        </Card>
      )}
    </>
  );
};

export default Header;
