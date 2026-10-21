"use client";

import { SignOut } from "@phosphor-icons/react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import { Modal } from "@/ui/Modal";

interface SignOutControlProps {
  onSignOut: () => void;
  isSigningOut: boolean;
  className?: string;
}

/**
 * The sign-out button and its confirmation, shared by the desktop sidebar and the account page,
 * which is where a phone user signs out (kit `mobile-sign-out`, D-01). The visible text is each
 * control's accessible name, with no `aria-label` over it (D-02, WCAG 2.5.3).
 *
 * Feature-free, as the `components` layer requires: the caller supplies the sign-out itself.
 */
const SignOutControl = ({ onSignOut, isSigningOut, className }: SignOutControlProps) => {
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={cn(
          "flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-status-error-bg hover:text-status-error",
          className,
        )}
      >
        <SignOut size={18} className="mr-3 shrink-0" />
        Sign out
      </button>

      <Modal
        title="Sign out"
        description="Are you sure you want to sign out?"
        open={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        className="mx-auto w-full max-w-md"
      >
        <div className="flex justify-center gap-4">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="w-full">
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="w-full"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default SignOutControl;
