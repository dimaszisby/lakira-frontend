"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import BottomNavigationBar from "./BottomNavigationBar";
import Sidebar from "./Sidebar";
import { navItems } from "./type";

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const Layout = ({ children, onLogout, isLoggingOut }: LayoutProps) => {
  const pathname = usePathname() ?? "/";

  return (
    <div className="flex min-h-screen w-full bg-bg text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
        Skip to content
      </a>

      <Sidebar
        navItems={navItems}
        pathname={pathname}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* pb-20 below lg clears the fixed BottomNavigationBar, which would otherwise cover the last
            control on the page (cypress-a11y-e2e, finding F-3). */}
        {/* tabIndex -1: the skip link's target, and where focus goes after an error boundary
            recovers (RouteErrorPanel). Not operable, so no focus ring. */}
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 overflow-x-hidden bg-bg pb-20 focus:outline-none sm:px-6 lg:px-8 lg:pb-8 lg:pt-6"
        >
          {children}
        </main>
      </div>

      <BottomNavigationBar navItems={navItems} pathname={pathname} />
    </div>
  );
};

export default Layout;
