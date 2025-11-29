import AppShell from "@/src/components/layout/Layout";

const AppAreaLayout = ({ children }: { children: React.ReactNode }) => {
  return <AppShell>{children}</AppShell>;
};

export default AppAreaLayout;
