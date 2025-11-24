"use client";

import { X } from "phosphor-react";
import type { ReactNode } from "react";

import { cn } from "@/src/lib/cn";

import type { CardSize, CardVariant } from "./Card";
import Card, { CardDescription, CardTitle } from "./Card";

type Size = CardSize;
type Variant = CardVariant;

interface Modal {
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  // visuals
  hideClose?: boolean;
  size?: Size;
  variant?: Variant;
  className?: string;
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
}: Modal) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn("fixed inset-0 z-50 flex items-center justify-center", "bg-black/50")}
    >
      <Card variant={variant} size={size} className={cn("relative", className)}>
        {hideClose ? null : (
          <button
            className="absolute right-4 top-4 text-ink-tertiary hover:text-status-error"
            onClick={onClose}
            aria-label="Close Modal"
          >
            <X size={24} />
          </button>
        )}
        <section className={cn("flex flex-col gap-4")}>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </section>

        {children ? <section className="mt-4">{children}</section> : null}
      </Card>
    </div>
  );
};

export default Modal;
