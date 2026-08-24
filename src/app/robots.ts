import type { MetadataRoute } from "next";

import { resolveAppOrigin } from "@/lib/env";

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
    // Everything below requires a session and would redirect a crawler to
    // /login. The proxy must never be crawled.
    disallow: ["/api/", "/dashboard", "/metrics", "/metric-categories", "/account"],
  },
  sitemap: `${resolveAppOrigin()}/sitemap.xml`,
});

export default robots;
