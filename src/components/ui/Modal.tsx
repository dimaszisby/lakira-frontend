"use client";

import { Dialog, DialogDescription, DialogDismiss, DialogHeading } from "@ariakit/react";
import { X } from "@phosphor-icons/react";
import type { ReactNode, RefObject } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

import type { CardSize, CardVariant } from "./Card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Accessible name when there is no visible title. */
  "aria-label"?: string;
  children: ReactNode;
  hideClose?: boolean;
  size?: CardSize;
  variant?: CardVariant;
  className?: string;
  closeOnOverlayClick?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

const DIALOG_ROOT_ID = "dialog-root";

/** One long-lived container for every dialog, created on first use. */
const getDialogRoot = (doc: Document) => {
  let root = doc.getElementById(DIALOG_ROOT_ID);
  if (!root) {
    root = doc.createElement("div");
    root.id = DIALOG_ROOT_ID;
    doc.body.appendChild(root);
  }
  return root;
};

const subscribeToNothing = () => () => {};

/** False on the server and during hydration, true once rendering on the client. */
const useIsClient = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

/**
 * A modal dialog built on Ariakit: it traps focus, locks page scroll, closes on
 * Escape or an outside click, and returns focus to where it came from.
 *
 * The dialog is portalled by React rather than by Ariakit. Ariakit's portal renders
 * the dialog in place for one commit and then moves it into its portal node, which
 * remounts everything inside. Forms relying on mount-time registration lose state
 * that way: MetricSettingsForm (react-hook-form with shouldUnregister) showed no
 * Priority and stale watched values. Rendering straight into a container mounts the
 * content once, and the container sits under <body>, so transformed ancestors such
 * as the mobile sidebar cannot clip the fixed-position dialog.
 */
export const Modal = ({
  open,
  onClose,
  title,
  description,
  "aria-label": ariaLabel,
  children,
  hideClose = false,
  size = "md",
  variant = "primary",
  className,
  closeOnOverlayClick = true,
  initialFocusRef,
}: ModalProps) => {
  const isClient = useIsClient();
  if (!isClient) return null;

  return createPortal(
    <Dialog
      open={open}
      onClose={onClose}
      unmountOnHide
      portal={false}
      hideOnInteractOutside={closeOnOverlayClick}
      // Ariakit reads the ref lazily once the dialog content has mounted.
      initialFocus={initialFocusRef as RefObject<HTMLElement> | undefined}
      backdrop={<div className="dialog-backdrop" />}
      aria-label={title ? undefined : ariaLabel}
      render={<Card as="section" size={size} variant={variant} elevation="md" />}
      className={cn("dialog", className)}
    >
      {hideClose ? null : (
        <DialogDismiss className="dialog-dismiss" aria-label="Close modal">
          <X aria-hidden />
        </DialogDismiss>
      )}

      {title || description ? (
        <CardHeader className={hideClose ? undefined : "dialog-header-with-dismiss"}>
          {title ? <DialogHeading render={<CardTitle />}>{title}</DialogHeading> : null}
          {description ? (
            <DialogDescription render={<CardDescription />}>{description}</DialogDescription>
          ) : null}
        </CardHeader>
      ) : null}

      {children ? <CardContent>{children}</CardContent> : null}
    </Dialog>,
    getDialogRoot(document),
  );
};
