import { motion, useAnimation, useMotionValue } from "framer-motion";
import { memo, useEffect, useRef } from "react";

import { cn } from "@/src/lib/cn";

interface SwipeAction {
  label: string;
  onClick: () => void;
  color?: string; // Tailwind color class
  icon?: React.ReactNode;
}

interface Props {
  children: React.ReactNode;
  actions: SwipeAction[];
  open?: boolean;
  onClose?: () => void;
}

const SWIPE_THRESHOLD = 0.4; // % of button area width

export const SwipeableCardBase = ({ children, actions, open = false, onClose }: Props) => {
  const cardWidth = actions.length * 64; // px
  const x = useMotionValue(0);
  const controls = useAnimation();
  const dragRef = useRef<HTMLDivElement | null>(null);

  const isDraggingRef = useRef(false);

  useEffect(() => {
    void controls.start({ x: open ? -cardWidth : 0 });
  }, [open, cardWidth, controls]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && dragRef.current && !dragRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return (
    <div className="relative w-full select-none overflow-clip rounded-2xl antialiased">
      {/* Actions */}
      <div className="absolute inset-y-0 right-0 z-0 flex h-full">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              action.onClick();
              onClose?.(); // Optionally close after action
            }}
            className={cn(
              "relative flex h-full w-16 items-center justify-center text-2xl text-ink",
              action.color || "bg-status-error",
              "transition-all duration-200 hover:brightness-90 active:scale-95",
            )}
            aria-label={action.label}
            type="button"
          >
            {action.icon || action.label}
          </button>
        ))}
      </div>

      {/* Card (swipeable) */}
      <motion.div
        ref={dragRef}
        className={cn(
          "relative z-10 bg-surface",
          "cursor-grab touch-pan-x border border-border p-4 active:cursor-grabbing",
        )}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -cardWidth, right: 0 }}
        dragElastic={0.15}
        style={{ x }}
        animate={controls}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={(_, info) => {
          const percentDragged = Math.abs(info.offset.x) / cardWidth;
          const shouldOpen = info.offset.x < 0 && percentDragged > SWIPE_THRESHOLD;
          void controls.start({ x: shouldOpen ? -cardWidth : 0 });
          if (!shouldOpen) onClose?.();

          // small delay before re-enabling taps to avoid “drag → click”
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        }}
        onClickCapture={(e) => {
          const isOpen = x.get() === -cardWidth;
          if (isDraggingRef.current) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          if (isOpen) {
            // tap on the card while open should close, not trigger child click
            e.stopPropagation();
            e.preventDefault();
            void controls.start({ x: 0 });
            onClose?.();
          }
        }}
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
