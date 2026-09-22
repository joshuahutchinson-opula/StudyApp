import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { useSpring } from "../../hooks/useSpring";

const DRAG_RANGE = 260; // px of drag mapped to the full preview tilt
const FLIP_THRESHOLD = 120; // px of drag before a turn commits
const MAX_TILT_DEG = 26;

interface PageTurnProps {
  pageKey: string;
  canGoNext: boolean;
  canGoPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  navDirection: 1 | -1 | 0;
  children: ReactNode;
}

export function PageTurn({
  pageKey,
  canGoNext,
  canGoPrev,
  onNext,
  onPrev,
  navDirection,
  children,
}: PageTurnProps) {
  const spring = useSpring();
  const dragX = useMotionValue(0);
  const rotateY = useTransform(dragX, [-DRAG_RANGE, DRAG_RANGE], [-MAX_TILT_DEG, MAX_TILT_DEG]);
  const leftShadow = useTransform(dragX, [-DRAG_RANGE, 0], [0.4, 0]);
  const rightShadow = useTransform(dragX, [0, DRAG_RANGE], [0, 0.4]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Settle the incoming page in from the direction it was turned, through the
    // same drag-driven motion value that powers the tilt/shadow while dragging —
    // one physical model for both gesture-driven and programmatic navigation.
    // The discipline spring is underdamped on purpose: the page carries its
    // momentum past rest and eases back, instead of stopping dead on arrival.
    dragX.set(navDirection * -70);
    const controls = animate(dragX, 0, spring.base);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  return (
    <div className="relative flex-1" style={{ perspective: 1800 }}>
      <motion.div
        drag="x"
        dragElastic={0.35}
        dragConstraints={{ left: canGoNext ? -DRAG_RANGE : 0, right: canGoPrev ? DRAG_RANGE : 0 }}
        dragTransition={{ bounceStiffness: spring.fast.stiffness, bounceDamping: spring.fast.damping }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -FLIP_THRESHOLD && canGoNext) {
            onNext();
          } else if (info.offset.x > FLIP_THRESHOLD && canGoPrev) {
            onPrev();
          } else {
            animate(dragX, 0, spring.base);
          }
        }}
        className="relative min-h-[520px] cursor-grab select-none overflow-hidden rounded-[var(--radius-base)] bg-[var(--color-surface)] p-10 active:cursor-grabbing"
        style={{
          x: dragX,
          rotateY,
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
          border: "1px solid var(--color-border)",
        }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-24"
          style={{ background: "linear-gradient(90deg, black, transparent)", opacity: leftShadow }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-24"
          style={{ background: "linear-gradient(270deg, black, transparent)", opacity: rightShadow }}
        />
        {children}
      </motion.div>

      {canGoPrev && (
        <button
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-3 text-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ‹
        </button>
      )}
      {canGoNext && (
        <button
          type="button"
          aria-label="Next page"
          onClick={onNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-3 text-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ›
        </button>
      )}
    </div>
  );
}
