import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";

const spring = { stiffness: 300, damping: 25, mass: 0.5 };

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const lift = useSpring(0, spring);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 14);
    rotateX.set((0.5 - py) * 14);
    ref.current?.style.setProperty("--spot-x", `${px * 100}%`);
    ref.current?.style.setProperty("--spot-y", `${py * 100}%`);
  }

  function handleMouseEnter() {
    if (!prefersReducedMotion) lift.set(-6);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
    lift.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, y: lift, transformPerspective: 800 }}
      className={`group relative overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) p-6 transition-[border-color,box-shadow] duration-300 hover:border-(--color-accent)/40 hover:shadow-xl hover:shadow-black/10 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(400px circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--color-accent-soft), transparent 70%)" }}
      />
      <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  );
}
