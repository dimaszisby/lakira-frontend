import type { ReactNode } from "react";

const MetricSettingsLayout = ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <>
      {children}
      {modal}
    </>
  );
};

export default MetricSettingsLayout;
