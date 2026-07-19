"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through example strings on an interval. Pins the first example when
 * the user prefers reduced motion.
 */
export function useRotatingPlaceholder(examples: string[], intervalMs = 2400) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % examples.length),
      intervalMs,
    );
    return () => clearInterval(timer);
  }, [examples.length, intervalMs]);

  return examples[index];
}
