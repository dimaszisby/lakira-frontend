"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import BottomNavigationBar from "./BottomNavigationBar";
import Sidebar from "./Sidebar";
import { navItems } from "./type";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname() ?? "/";
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-bg text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
        Skip to content
      </a>

      <Sidebar
        navItems={navItems}
        pathname={pathname}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface2 bg-bg/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-xl border border-transparent bg-surface px-3 py-2 text-ink transition hover:border-surface2"
            aria-label="Open navigation menu"
          >
            <List size={20} />
          </button>
          <div>
            <p className="text-ink-muted text-sm">Lakira</p>
            <p className="text-base font-semibold">Analytics Console</p>
          </div>
        </header> */}

        <main
          id="main"
          // className="flex-1 overflow-x-hidden bg-blue-500 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6"
          className="flex-1 overflow-x-hidden bg-bg sm:px-6 lg:px-8 lg:pb-8 lg:pt-6"
        >
          {children}
        </main>
      </div>

      <BottomNavigationBar
        navItems={navItems}
        pathname={pathname}
        onLinkClick={() => setMobileSidebarOpen(false)}
      />
    </div>
  );
};

export default Layout;
