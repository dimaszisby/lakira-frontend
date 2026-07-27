import type { ReactNode } from "react";

const MetricCategoriesLayout = ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <>
      {children}
      {modal}
    </>
  );
};

export default MetricCategoriesLayout;
