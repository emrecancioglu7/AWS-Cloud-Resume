import { cloneElement, useId, useState, type ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Tooltip({ label, children, className = "relative inline-flex" }: { label: string; children: ReactElement; className?: string }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  const trigger = cloneElement(children, { "aria-describedby": id } as Record<string, unknown>);

  return (
    <span
      className={className}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {trigger}
      <AnimatePresence>
        {visible && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 whitespace-normal break-words rounded-md bg-(--color-text) px-3 py-2 text-left text-xs font-medium leading-relaxed text-(--color-bg) shadow-lg"
          >
            {label}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-(--color-text)" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
