import "@/styles/globals.css";

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Quicksand } from "next/font/google";

import { Providers } from "./providers";
import ThemeScript from "./ThemeScript";

export const metadata: Metadata = {
  title: "Lakira - Your Personal Growth Tracker",
  description:
    "Track and monitor your progress seamlessly. Set goals, view trends, and stay motivated!",
};

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quicksand.variable} ${plusJakartaSans.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <ThemeScript />
      </head>
      <body className=" min-h-dvh font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
