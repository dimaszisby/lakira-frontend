import type { ReactNode } from "react";

import { APP_NAME } from "@/constants/app";
import Header from "@/src/components/layout/Header";

const AuthSegmentLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <Header />
      {/* tabIndex -1: where focus goes after an error boundary recovers (RouteErrorPanel). */}
      <main tabIndex={-1} className="grid place-items-center p-4 focus:outline-none">
        {children}
      </main>
      <footer className="p-4 text-center text-ink-secondary">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
};

export default AuthSegmentLayout;
