import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

// Matches both "19%" (English) and "%19" (Turkish percent-first convention), plus "$200k" / "3x".
const METRIC_PATTERN = /(?<![\w.])(?:%\d+(?:\.\d+)?(?!\w)|\$?\d+(?:\.\d+)?(?:%|x|K|k)(?!\w))/g;

function parseMetric(value: string) {
  if (value.startsWith("%")) {
    return { prefix: "%", target: parseFloat(value.slice(1)), suffix: "" };
  }
  const match = value.match(/^(\$)?(\d+(?:\.\d+)?)(%|x|K|k)?$/);
  return { prefix: match?.[1] ?? "", target: match ? parseFloat(match[2]) : 0, suffix: match?.[3] ?? "" };
}

function CountUpMetric({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const prefersReducedMotion = useReducedMotion();

  const { prefix, target, suffix } = parseMetric(value);
  const [display, setDisplay] = useState(prefersReducedMotion ? target : 0);

  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;
    const duration = 1100;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target, prefersReducedMotion]);

  const formatted = Number.isInteger(target) ? Math.round(display) : display.toFixed(1);

  return (
    <strong ref={ref} className="font-semibold text-(--color-accent) tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </strong>
  );
}

export function AnimatedMetrics({ text }: { text: string }) {
  const parts: Array<{ text: string; isMetric: boolean }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(METRIC_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push({ text: text.slice(lastIndex, index), isMetric: false });
    parts.push({ text: match[0], isMetric: true });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isMetric: false });

  return (
    <>
      {parts.map((part, i) => (part.isMetric ? <CountUpMetric key={i} value={part.text} /> : <span key={i}>{part.text}</span>))}
    </>
  );
}
