// atom/userAtom.ts

import { atom } from "jotai";

export interface UserAtom {
  id: string;
  username: string;
  email: string;
  isPublicProfile: boolean;
  /** When the address was confirmed, or null while unverified. */
  emailVerifiedAt?: string | null;
  role: "admin" | "user";
  token?: string;
}

export const userAtom = atom<UserAtom | null>(null);
