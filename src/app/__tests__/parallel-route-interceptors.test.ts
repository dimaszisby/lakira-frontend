/**
 * @jest-environment node
 *
 * Reads the route tree from disk; nothing is rendered.
 */

import { existsSync, readdirSync, statSync } from "fs";
import path from "path";

/**
 * A parallel slot must not hold two interceptors that can match the same
 * segment.
 *
 * `metrics/[metricId]/logs/@modal` held `(.)new` and `(.)[logId]` side by side.
 * Both match a single segment, and Next built the interception path with the
 * marker applied twice — `/metrics/<id>/logs/(.)(.)new` — which
 * `extractInterceptionRouteInformation` rejects, because splitting that on
 * `(.)` leaves an empty intercepted route.
 *
 * The symptom was quiet enough to survive a release: the throw killed the soft
 * navigation, Next fell back to a full page load, and the modal still appeared
 * — over a reloaded page rather than over the list, with a 500 logged on every
 * click. A test that renders cannot see that. Reading the directory names can.
 *
 * Sibling interceptors are fine when only one can match a given segment:
 * `metrics/@modal` pairs `(.)new` with `(.)[metricId]/edit`, and the second is a
 * nested path rather than a bare leaf, so nothing is ambiguous.
 */

const APP_DIR = path.join(process.cwd(), "src", "app");

/** Next's markers, longest first so `(..)(..)` is not read as `(..)`. */
const MARKERS = ["(..)(..)", "(...)", "(..)", "(.)"];

const markerFor = (name: string): string | null =>
  MARKERS.find((marker) => name.startsWith(marker)) ?? null;

const isDirectory = (target: string) => existsSync(target) && statSync(target).isDirectory();

/** A leaf interceptor owns a `page` file directly, so it matches one segment. */
const isLeafRoute = (dir: string) =>
  ["page.tsx", "page.ts", "page.jsx", "page.js"].some((file) => existsSync(path.join(dir, file)));

const isDynamicSegment = (segment: string) => segment.startsWith("[");

const collectSlotDirs = (dir: string, found: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!isDirectory(full)) continue;
    if (entry.startsWith("@")) found.push(full);
    collectSlotDirs(full, found);
  }
  return found;
};

describe("parallel route slots", () => {
  const slotDirs = collectSlotDirs(APP_DIR);

  it("finds the slots it is meant to be checking", () => {
    // Guards against the walker silently matching nothing, which is how an
    // unenforced rule looks exactly like a passing one.
    expect(slotDirs.length).toBeGreaterThan(0);
  });

  it.each(slotDirs.map((dir) => [path.relative(APP_DIR, dir), dir]))(
    "%s holds no two interceptors that match the same segment",
    (_label, dir) => {
      const leafInterceptors = readdirSync(dir)
        .map((entry) => ({ entry, full: path.join(dir, entry) }))
        .filter(({ full }) => isDirectory(full))
        .map(({ entry, full }) => ({ entry, full, marker: markerFor(entry) }))
        .filter((candidate): candidate is typeof candidate & { marker: string } =>
          Boolean(candidate.marker),
        )
        .filter(({ full }) => isLeafRoute(full))
        .map(({ entry, marker }) => ({ marker, segment: entry.slice(marker.length) }));

      const byMarker = new Map<string, string[]>();
      for (const { marker, segment } of leafInterceptors) {
        byMarker.set(marker, [...(byMarker.get(marker) ?? []), segment]);
      }

      for (const [marker, segments] of byMarker) {
        const dynamic = segments.filter(isDynamicSegment);
        const staticOnes = segments.filter((segment) => !isDynamicSegment(segment));

        // A dynamic leaf swallows every static sibling under the same marker.
        expect({
          marker,
          dynamic,
          static: staticOnes,
          conflict: dynamic.length > 0 && staticOnes.length > 0,
        }).toMatchObject({ conflict: false });

        expect(dynamic.length).toBeLessThanOrEqual(1);
      }
    },
  );
});
