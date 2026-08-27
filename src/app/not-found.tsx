import Link from "next/link";

import Button from "@/ui/Button";

/**
 * Root 404. Without this, an unknown URL renders the unstyled Next.js default —
 * one of the first things a forker sees go wrong.
 */
const NotFound = () => (
  <main className="flex min-h-dvh flex-col items-center justify-center gap-6">
    <h1 className="text-center">Page not found</h1>
    <p className="max-w-prose text-center">
      That page does not exist, or it may have moved.
    </p>
    <Link href="/" aria-label="Back to the home page" className="w-auto">
      <Button variant="primary">Back to home</Button>
    </Link>
  </main>
);

export default NotFound;
