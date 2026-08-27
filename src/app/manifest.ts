import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@/constants/app";

const manifest = (): MetadataRoute.Manifest => ({
  name: APP_NAME,
  short_name: APP_NAME,
  description: APP_DESCRIPTION,
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#ffffff",
  icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
});

export default manifest;
