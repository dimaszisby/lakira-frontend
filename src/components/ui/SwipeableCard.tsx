"use client";

import { motion, useAnimation, useMotionValue } from "framer-motion";
import type { ReactNode } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type SwipeAction = {
  id?: string;
  label: string;
  onClick: () => void;
  color?: string;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

type SwipeableCardProps = {
  children: ReactNode;
  actions: SwipeAction[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  className?: string;
  actionsAriaLabel?: string;
  disabled?: boolean;
};

const SWIPE_THRESHOLD = 0.4;
const ACTION_WIDTH = 64;

export const SwipeableCardBase = ({
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
  const hasActions = actions.length > 0;
  const actionAreaWidth = hasActions ? actions.length * ACTION_WIDTH : 0;
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? !!open : internalOpen;

  const x = useMotionValue(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement | null>(null);
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
      if (dragResetTimeoutRef.current != null) {
        window.clearTimeout(dragResetTimeoutRef.current);
      }
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
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-clip rounded-2xl antialiased"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          closePanel();
        }
      }}
    >
      <div
        className="absolute inset-y-0 right-0 z-0 flex h-full"
        role="group"
        aria-label={actionsAriaLabel}
      >
        {actions.map((action, index) => (
          <button
            key={action.id ?? `${action.label}-${index}`}
            type="button"
            aria-label={action.label}
            aria-hidden={!isOpen}
            tabIndex={isOpen ? 0 : -1}
            disabled={action.disabled}
            onClick={() => {
              action.onClick();
              closePanel();
            }}
            className={cn(
              "relative flex h-full w-16 items-center justify-center text-2xl text-ink",
              action.color ?? "bg-status-error",
              action.className,
              "transition-all duration-200 hover:brightness-95 active:scale-95 disabled:opacity-60",
            )}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </div>

      <motion.div
        className={cn(
          "relative z-10 rounded-2xl border border-border bg-surface p-4",
          "cursor-grab touch-pan-x active:cursor-grabbing",
          className,
        )}
        drag={disabled || !hasActions ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -actionAreaWidth, right: 0 }}
        dragElastic={0.15}
        style={{ x }}
        animate={controls}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={(_, info) => {
          if (!hasActions || disabled || actionAreaWidth <= 0) {
            closePanel();
            return;
          }

          const percentDragged = Math.abs(info.offset.x) / actionAreaWidth;
          const shouldOpen = info.offset.x < 0 && percentDragged > SWIPE_THRESHOLD;
          if (shouldOpen) openPanel();
          else closePanel();

          if (dragResetTimeoutRef.current != null) {
            window.clearTimeout(dragResetTimeoutRef.current);
          }
          dragResetTimeoutRef.current = window.setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        }}
        onClickCapture={(event) => {
          if (isDraggingRef.current) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          if (isOpen) {
            event.preventDefault();
            event.stopPropagation();
            closePanel();
          }
        }}
        data-open={isOpen}
      >
        {children}
      </motion.div>
    </div>
  );
};

SwipeableCardBase.displayName = "SwipeableCard";

const SwipeableCard = memo(SwipeableCardBase);
SwipeableCard.displayName = "SwipeableCard";

export default SwipeableCard;
