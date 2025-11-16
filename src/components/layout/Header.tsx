"use client";

import { useAtom } from "jotai";
import Link from "next/link";

import { userAtom } from "@/services/state/atoms";
import Container from "@/ui/Container";

const Header = () => {
  const [user] = useAtom(userAtom);

  return (
    <>
      {user ? null : (
        <Container className="m-4">
          <header>
            <nav className="flex w-full justify-between items-center">
              <>
                <Link href="/" className="text-h5 font-bold text-brand-primary">
                  Lakira
                </Link>

                <div className="flex flex-row gap-12 text-nav-item">
                  <Link href="/login">Login</Link>
                  <Link href="/register">Register</Link>
                </div>
              </>
            </nav>
          </header>
        </Container>
      )}
    </>
  );
};

export default Header;
