"use client";

import { X } from "phosphor-react";
import type { ReactNode, RefObject } from "react";
import { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/cn";

import type { CardSize, CardVariant } from "./Card";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

type Size = CardSize;
type Variant = CardVariant;

const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

export interface ModalProps {
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  hideClose?: boolean;
  size?: Size;
  variant?: Variant;
  className?: string;
  closeOnOverlayClick?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

const Modal = ({
  title,
  description,
  isOpen,
  onClose,
  children,
  hideClose = false,
  size = "md",
  variant = "primary",
  className,
  closeOnOverlayClick = true,
  initialFocusRef,
}: ModalProps) => {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const activeElement = document.activeElement;
    previousFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = getFocusableElements(dialog);
      const preferredInitial = initialFocusRef?.current;
      const focusTarget =
        preferredInitial && dialog.contains(preferredInitial)
          ? preferredInitial
          : focusable[0] ?? dialog;

      focusTarget.focus();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
  }, [initialFocusRef, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (!closeOnOverlayClick) return;
        if (event.target !== event.currentTarget) return;
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }

        if (event.key !== "Tab") return;

        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = getFocusableElements(dialog);
        if (focusable.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeElement = document.activeElement;
        const active = activeElement instanceof HTMLElement ? activeElement : null;

        if (event.shiftKey) {
          if (!active || !dialog.contains(active) || active === first) {
            event.preventDefault();
            last.focus();
          }
          return;
        }

        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <Card
        as="section"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        variant={variant}
        size={size}
        className={cn("relative mx-auto w-full max-w-xl", className)}
      >
        {!hideClose ? (
          <button
            type="button"
            className="text-ink-muted absolute right-4 top-4 rounded-md p-2 transition hover:text-ink"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        ) : null}

        {title || description ? (
          <CardHeader className={cn(!hideClose ? "pr-10" : undefined)}>
            {title ? <CardTitle id={titleId}>{title}</CardTitle> : null}
            {description ? <CardDescription id={descriptionId}>{description}</CardDescription> : null}
          </CardHeader>
        ) : null}

        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </div>
  );
};

export default Modal;
