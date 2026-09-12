import type { Ref, RefCallback } from "react";

/**
 * Combines several refs into one ref callback, so a component can keep its own
 * ref to a DOM node while still forwarding the caller's `ref`.
 *
 * Returns a React 19 cleanup: function refs that returned their own cleanup get
 * it called, other function refs receive `null`, and object refs are reset.
 */
export const composeRefs =
  <T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> =>
  (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") {
        const cleanup = ref(node);
        return typeof cleanup === "function" ? cleanup : () => ref(null);
      }
      if (ref) {
        ref.current = node;
        return () => {
          ref.current = null;
        };
      }
      return undefined;
    });

    return () => {
      for (const cleanup of cleanups) cleanup?.();
    };
  };
