import type { MetadataRoute } from "next";

import { resolveAppOrigin } from "@/lib/env";

// Only the unauthenticated surface belongs here; every other route requires a
// session and would 302 to /login.
const PUBLIC_PATHS = ["/", "/login", "/register"] as const;

const sitemap = (): MetadataRoute.Sitemap => {
  const origin = resolveAppOrigin();
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.5,
  }));
};

export default sitemap;
