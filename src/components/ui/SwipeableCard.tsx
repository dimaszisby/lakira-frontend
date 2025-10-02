import { motion, useAnimation, useMotionValue } from "framer-motion";
import { memo } from "react";
import { useEffect, useRef } from "react";

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

function getRoundedClass(index: number, total: number) {
  if (index === 0) return "rounded-l-xl";
  if (index === total - 1) return "rounded-r-2xl";
  return "";
}

const SWIPE_THRESHOLD = 0.4; // % of button area width

export const SwipeableCardBase = ({ children, actions, open = false, onClose }: Props) => {
  const cardWidth = actions.length * 64; // px
  const x = useMotionValue(0);
  const controls = useAnimation();
  const dragRef = useRef<HTMLDivElement | null>(null);

  // NEW: track dragging + “open” states to suppress child clicks
  const isDraggingRef = useRef(false);

  // If "open" prop changes, animate
  useEffect(() => {
    void controls.start({ x: open ? -cardWidth : 0 });
  }, [open, cardWidth, controls]);

  // Click outside to close (optional)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && dragRef.current && !dragRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // * Styling Variables
  const cornerRadius = "rounded-2xl"; // Tailwind's rounded-xl equivalent

  return (
    <div className="relative w-full select-none">
      {/* Actions */}
      <div className="absolute inset-y-0 right-0 z-0 flex h-full">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              action.onClick();
              onClose?.(); // Optionally close after action
            }}
            className={`relative flex h-full w-16 items-center justify-center 
        text-2xl text-white  ${getRoundedClass(i, actions.length)}
        ${action.color || "bg-red-500"}
        transition-all duration-200 hover:brightness-90 active:scale-95`}
            aria-label={action.label}
            // tabIndex={0}
            type="button"
          >
            {action.icon || action.label}
          </button>
        ))}
      </div>

      {/* Card (swipeable) */}
      <motion.div
        ref={dragRef}
        className={`relative z-10 bg-white ${cornerRadius} cursor-grab touch-pan-x border p-4 active:cursor-grabbing`}
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
        // --- NEW: consume taps when open or just dragged ---
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
        onClick={() => {
          // If open, close on tap
          if (x.get() === -cardWidth) {
            void controls.start({ x: 0 });
            onClose?.();
          }
        }}
        // role="group"
        // tabIndex={0}
      >
        {children}
      </motion.div>
    </div>
  );
};
SwipeableCardBase.displayName = "SwipableCard";

const SwipeableCard = memo(SwipeableCardBase);
SwipeableCard.displayName = "SwipableCard";
export default SwipeableCard;
