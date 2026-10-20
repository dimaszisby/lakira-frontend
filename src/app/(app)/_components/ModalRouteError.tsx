"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { Modal } from "@/ui/Modal";
import { RouteErrorPanel } from "@/ui/RouteErrorPanel";

export const MODAL_ROUTE_ERROR_TITLE = "Unable to open this dialog";

type ModalRouteErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * What every `@modal` slot's `error.tsx` renders (register row F-47). Without it, an error thrown
 * in an intercepted route reached `(app)/error.tsx`, which replaced the list under the dialog as
 * well. The slot's own boundary keeps the page underneath and shows the error where the dialog
 * would have been, in a dialog that closes back to that page the way the feature dialogs do.
 */
const ModalRouteError = ({ error, retry }: ModalRouteErrorProps) => {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
    // As MetricFormDialog: the page under the dialog may have changed while it was open.
    setTimeout(() => {
      router.refresh();
    }, 0);
  }, [router]);

  return (
    <Modal open onClose={handleClose} aria-label={MODAL_ROUTE_ERROR_TITLE}>
      <RouteErrorPanel
        error={error}
        retry={retry}
        title={MODAL_ROUTE_ERROR_TITLE}
        headingLevel={2}
        // Clears the dialog's close button, which sits in its top-right corner.
        className="mt-10"
      />
    </Modal>
  );
};

export default ModalRouteError;
