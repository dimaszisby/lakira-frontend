import type { ReactNode } from "react";

const MetricsLayout = ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <>
      {children}
      {modal}
    </>
  );
};

export default MetricsLayout;
