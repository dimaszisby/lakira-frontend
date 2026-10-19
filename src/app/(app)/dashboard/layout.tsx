import React from "react";

export const metadata = {
  title: "Dashboard",
};

// The page's one h1 lives here rather than in the page, so it stays on screen while `loading.tsx`
// shows and above `error.tsx`, whose own heading is therefore an h2.
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Dashboard</h1>
      </header>
      {children}
    </div>
  );
};
export default DashboardLayout;
