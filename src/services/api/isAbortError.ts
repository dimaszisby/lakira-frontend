import axios from "axios";

/**
 * True when an error represents a canceled/aborted request.
 */
export function isAbortError(err: unknown): boolean {
  // IF: DOM AbortController case
  if (typeof DOMException !== "undefined" && err instanceof DOMException) {
    if (err.name === "AbortError") return true;
  }

  // IF: Axios v1 (CancelToken or AbortController)
  if (typeof axios.isCancel === "function" && axios.isCancel(err)) {
    return true;
  }

  // Shape checks
  if (typeof err === "object" && err !== null) {
    // name
    if ("name" in err && typeof (err as { name: unknown }).name === "string") {
      const n = (err as { name: string }).name;
      if (n === "AbortError" || n === "CanceledError") return true;
    }
    // code
    if ("code" in err && typeof (err as { code: unknown }).code === "string") {
      if ((err as { code: string }).code === "ERR_CANCELED") return true;
    }
    // message
    if ("message" in err && typeof (err as { message: unknown }).message === "string") {
      if ((err as { message: string }).message === "canceled") return true;
    }
  }
  return false;
}

/**
 * Return an AbortError compatible instance (safe on Node/SSR).
 */
export function toAbortDomException(): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The operation was aborted.", "AbortError");
  }
  const e = new Error("The operation was aborted.");
  Object.defineProperty(e, "name", { value: "AbortError" });
  return e;
}
