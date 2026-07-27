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
        <main
          id="main"
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
