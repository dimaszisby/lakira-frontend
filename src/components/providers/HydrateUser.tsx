
"use client";

import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";

import type { UserAtom } from "@/services/state/atoms";
import { userAtom } from "@/services/state/atoms";

type HydrateUserProps = {
  initialUser: UserAtom | null;
  children: ReactNode;
};

const HydrateUser = ({ initialUser, children }: HydrateUserProps) => {
  useHydrateAtoms([[userAtom, initialUser]]);
  return <>{children}</>;
};

export default HydrateUser;
