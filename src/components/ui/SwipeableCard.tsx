"use client";

import { DotsThreeVertical } from "@phosphor-icons/react";
import { motion, useAnimation, useMotionValue, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type SwipeActionTone = "neutral" | "info" | "danger";

export type SwipeAction = {
  id?: string;
  label: string;
  onClick: () => void;
  tone?: SwipeActionTone;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SwipeableCardProps = {
  children: ReactNode;
  actions: SwipeAction[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  /** Applied to the sliding surface. */
  className?: string;
  actionsAriaLabel?: string;
  disabled?: boolean;
};

const SWIPE_THRESHOLD = 0.4;
/** Pixel width of one action; matches `--swipe-action-width`. */
const ACTION_WIDTH = 64;
const SPRING = { type: "spring", stiffness: 500, damping: 35 } as const;
const INSTANT = { duration: 0 } as const;

/**
 * A card that slides left to reveal actions. Swiping is never the only way in:
 * a "More actions" button toggles the same panel for keyboard and single-pointer users.
 */
export const SwipeableCard = ({
  children,
  actions,
  open,
  defaultOpen = false,
  onOpenChange,
  onClose,
  className,
  actionsAriaLabel = "Swipe actions",
  disabled = false,
}: SwipeableCardProps) => {
  const actionsId = useId();
  const hasActions = actions.length > 0;
  const actionAreaWidth = actions.length * ACTION_WIDTH;
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = typeof open === "boolean" ? open : internalOpen;
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isDraggingRef = useRef(false);
  const dragResetTimeoutRef = useRef<number | null>(null);

  const syncOpenState = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
      if (!nextOpen) onClose?.();
    },
    [isControlled, onClose, onOpenChange],
  );

  useEffect(() => {
    void controls.start({ x: isOpen && hasActions ? -actionAreaWidth : 0 });
  }, [actionAreaWidth, controls, hasActions, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current || containerRef.current.contains(event.target as Node)) return;
      syncOpenState(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, syncOpenState]);

  useEffect(
    () => () => {
      if (dragResetTimeoutRef.current !== null) window.clearTimeout(dragResetTimeoutRef.current);
    },
    [],
  );

  const closePanel = () => {
    if (!isOpen) return;
    syncOpenState(false);
    void controls.start({ x: 0 });
  };

  const openPanel = () => {
    if (!hasActions || disabled) return;
    syncOpenState(true);
    void controls.start({ x: -actionAreaWidth });
  };

  return (
    // The handler is Escape-to-dismiss for the panel, not an activation: the
    // card's own actions are real <button>s inside `actions`, and the drag has
    // a keyboard alternative per WCAG 2.5.7. Giving this container a role and a
    // tabstop to satisfy the rule would add a focus stop that does nothing.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={containerRef}
      data-open={isOpen}
      className="swipe-card"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isOpen) return;
        event.preventDefault();
        const focusWasInActions = actionsRef.current?.contains(document.activeElement) ?? false;
        closePanel();
        if (focusWasInActions) toggleRef.current?.focus();
      }}
    >
      <motion.div
        className={cn("swipe-card-surface", className)}
        drag={disabled || !hasActions ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -actionAreaWidth, right: 0 }}
        dragElastic={0.15}
        // eslint-disable-next-line no-restricted-syntax -- framer-motion drives the drag offset through a MotionValue, not CSS
        style={{ x }}
        animate={controls}
        transition={prefersReducedMotion ? INSTANT : SPRING}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={(_, info) => {
          if (!hasActions || disabled) {
            closePanel();
            return;
          }

          const percentDragged = Math.abs(info.offset.x) / actionAreaWidth;
          if (info.offset.x < 0 && percentDragged > SWIPE_THRESHOLD) openPanel();
          else closePanel();

          if (dragResetTimeoutRef.current !== null) {
            window.clearTimeout(dragResetTimeoutRef.current);
          }
          dragResetTimeoutRef.current = window.setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        }}
        onClickCapture={(event) => {
          // A drag ending over the card must not click it, and a tap while open only closes.
          if (isDraggingRef.current || isOpen) {
            event.preventDefault();
            event.stopPropagation();
            if (!isDraggingRef.current) closePanel();
          }
        }}
      >
        <div className="swipe-card-content">{children}</div>

        {hasActions ? (
          <button
            ref={toggleRef}
            type="button"
            className="swipe-card-toggle"
            aria-expanded={isOpen}
            aria-controls={actionsId}
            aria-label={isOpen ? "Hide actions" : "More actions"}
            disabled={disabled}
            onClick={openPanel}
          >
            <DotsThreeVertical weight="bold" aria-hidden />
          </button>
        ) : null}
      </motion.div>

      <div
        ref={actionsRef}
        id={actionsId}
        role="group"
        aria-label={actionsAriaLabel}
        inert={!isOpen}
        className="swipe-card-actions"
      >
        {actions.map((action, index) => (
          <button
            key={action.id ?? `${action.label}-${index}`}
            type="button"
            aria-label={action.label}
            disabled={action.disabled}
            data-tone={action.tone ?? "neutral"}
            className="swipe-card-action"
            onClick={() => {
              action.onClick();
              closePanel();
            }}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </div>
    </div>
  );
};
