import type { ReactNode } from "react";

const MetricLogsLayout = ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <>
      {children}
      {modal}
    </>
  );
};

export default MetricLogsLayout;
