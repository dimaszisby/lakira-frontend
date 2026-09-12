import { createRef } from "react";

import { composeRefs } from "@/lib/compose-refs";

describe("composeRefs", () => {
  it("assigns the node to object refs and calls callback refs", () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = jest.fn();
    const node = document.createElement("div");

    composeRefs(objectRef, callbackRef)(node);

    expect(objectRef.current).toBe(node);
    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it("ignores undefined and null refs", () => {
    const node = document.createElement("div");

    expect(() => composeRefs<HTMLDivElement>(undefined, null)(node)).not.toThrow();
  });

  it("resets object refs and calls callback refs with null on cleanup", () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = jest.fn();
    const node = document.createElement("div");

    const cleanup = composeRefs(objectRef, callbackRef)(node);
    cleanup?.();

    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it("runs a callback ref's own cleanup instead of calling it with null", () => {
    const ownCleanup = jest.fn();
    const callbackRef = jest.fn(() => ownCleanup);
    const node = document.createElement("div");

    const cleanup = composeRefs<HTMLDivElement>(callbackRef)(node);
    cleanup?.();

    expect(ownCleanup).toHaveBeenCalledTimes(1);
    expect(callbackRef).toHaveBeenCalledTimes(1);
  });
});
