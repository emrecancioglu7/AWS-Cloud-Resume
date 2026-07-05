import { createContext, useContext, useLayoutEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type MotionValue,
  type Variants,
} from "framer-motion";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const TimelineContext = createContext<{ progress: MotionValue<number>; containerRef: RefObject<HTMLDivElement | null> } | null>(null);

export function Timeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });

  return (
    <TimelineContext.Provider value={{ progress: scrollYProgress, containerRef: ref }}>
      <motion.div
        ref={ref}
        className="relative"
        initial={prefersReducedMotion ? "visible" : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        variants={prefersReducedMotion ? undefined : containerVariants}
      >
        <div className="absolute top-1 bottom-1 left-[5px] w-px bg-(--color-border)" />
        <motion.div
          className="absolute top-1 left-[5px] w-px origin-top bg-(--color-accent)"
          style={{ scaleY: prefersReducedMotion ? 1 : scrollYProgress, height: "calc(100% - 0.5rem)" }}
        />
        {children}
      </motion.div>
    </TimelineContext.Provider>
  );
}

// Crossing tolerance: fire once when scroll progress passes within this distance of the
// item's own threshold, then re-arm once it's well clear so scrolling back replays it.
const TRIGGER_BAND = 0.02;
const REARM_BAND = 0.08;

export function TimelineItem({ children }: { children: ReactNode }) {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("TimelineItem must be used within a Timeline");
  const { progress, containerRef } = ctx;

  const prefersReducedMotion = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const thresholdRef = useRef(0);
  const armedRef = useRef(true);

  const dotScale = useMotionValue(1);
  const glow = useMotionValue(0);
  const ringScale = useMotionValue(1);
  const ringOpacity = useMotionValue(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const dot = dotRef.current;
    if (!container || !dot) return;

    const update = () => {
      const containerRect = container.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const containerHeight = container.scrollHeight;
      if (containerHeight > 0) thresholdRef.current = (dotRect.top - containerRect.top) / containerHeight;
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  useMotionValueEvent(progress, "change", (latest) => {
    if (prefersReducedMotion) return;
    const dist = Math.abs(latest - thresholdRef.current);

    if (dist < TRIGGER_BAND && armedRef.current) {
      armedRef.current = false;
      animate(dotScale, [1, 1.7, 1], { duration: 0.6, ease: ["easeOut", "easeIn"] });
      animate(glow, [0, 1, 0], { duration: 0.6, ease: "easeOut" });
      ringScale.set(1);
      ringOpacity.set(0.6);
      animate(ringScale, 2.6, { duration: 0.65, ease: "easeOut" });
      animate(ringOpacity, 0, { duration: 0.65, ease: "easeOut" });
    } else if (dist > REARM_BAND) {
      armedRef.current = true;
    }
  });

  const boxShadow = useMotionValue("none");
  useMotionValueEvent(glow, "change", (v) => boxShadow.set(v > 0.02 ? `0 0 ${v * 10}px ${v * 3}px var(--color-accent)` : "none"));

  return (
    <motion.div variants={itemVariants} className="relative mb-6 pl-6 last:mb-0">
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full border border-(--color-accent)"
          style={{ scale: ringScale, opacity: ringOpacity }}
        />
      )}
      <motion.div
        ref={dotRef}
        aria-hidden="true"
        className="absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full bg-(--color-accent) ring-4 ring-(--color-bg)"
        style={prefersReducedMotion ? undefined : { scale: dotScale, boxShadow }}
      />
      {children}
    </motion.div>
  );
}
