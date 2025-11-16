"use client";

import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="min-h-screen flex-1 overflow-x-hidden sm:p-0 sm:pb-24 lg:ml-[272px] lg:p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
