import { atom } from "jotai";
import type { BucketAlias, TimeRangeValue } from "./types";

export const globalBucketAtom = atom<BucketAlias>("1d");

export const globalRangeAtom = atom<TimeRangeValue>({
  mode: "relative",
  last: "30d",
});
