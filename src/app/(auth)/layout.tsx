import type { ReactNode } from "react";

import Header from "@/src/components/layout/Header";

const AuthSegmentLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <Header />
      <main className="grid place-items-center p-4">{children}</main>
      <footer className="text-ink-600 p-4 text-center">© {new Date().getFullYear()} Lakira</footer>
    </div>
  );
};

export default AuthSegmentLayout;
