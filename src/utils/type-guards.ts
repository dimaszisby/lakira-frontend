// Side-effect free, pure TS helpers
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export const numberOrUndef = (v: unknown): number | undefined =>
  typeof v === "number" ? v : undefined;
