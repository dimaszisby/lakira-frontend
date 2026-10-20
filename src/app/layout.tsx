import "@/styles/globals.css";

import type { Metadata } from "next";
import { headers } from "next/headers";

import { APP_DESCRIPTION, APP_NAME, TITLE_SEPARATOR } from "@/constants/app";
import { NONCE_HEADER } from "@/lib/csp";

import WebVitalsReporter from "./_components/WebVitalsReporter";
import { plusJakartaSans, quicksand } from "./fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Your Personal Growth Tracker`,
    template: `%s ${TITLE_SEPARATOR} ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    siteName: APP_NAME,
    title: `${APP_NAME} - Your Personal Growth Tracker`,
    description: APP_DESCRIPTION,
    type: "website",
  },
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  // Set by src/proxy.ts for this request. Next stamps it on its own scripts
  // without being asked; next-themes' pre-paint script is the one inline script
  // it does not own, so the nonce is handed down for that (ADR-0026). Reading a
  // header also makes every page render per request, which a nonce requires.
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quicksand.variable} ${plusJakartaSans.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className=" min-h-dvh font-sans antialiased">
        <WebVitalsReporter />
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
