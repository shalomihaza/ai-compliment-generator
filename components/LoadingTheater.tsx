"use client";

import { useEffect, useState } from "react";

const STATUS_LINES = [
  "Consulting the Bureau of Excellence…",
  "Verifying percentile claims…",
  "Escalating to the Department of Metaphors…",
  "Running brand compliance audit…",
  "Cross-referencing the Registry of Legends…",
  "Calibrating enthusiasm to unsafe levels…",
];

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Three skeleton cards set the expectation of three results (and prevent
 * layout shift); a rotating status line does the entertaining.
 */
export function LoadingTheater() {
  const [lines, setLines] = useState<string[]>(() => shuffled(STATUS_LINES));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => {
        if (current + 1 >= lines.length) {
          setLines(shuffled(STATUS_LINES));
          return 0;
        }
        return current + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [lines.length]);

  return (
    <div className="mt-10" role="status" aria-live="polite">
      <p
        key={lines[index]}
        className="line-in text-center text-gold text-sm uppercase tracking-widest mb-8"
      >
        {lines[index]}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((slot) => (
          <div
            key={slot}
            className="shimmer bg-paper/10 border border-ink-line rounded-lg p-6 h-72"
            style={{ animationDelay: `${slot * 0.2}s` }}
          >
            <div className="bg-paper/20 h-6 w-32 rounded-full mb-6" />
            <div className="space-y-3">
              <div className="bg-paper/20 h-4 w-full rounded" />
              <div className="bg-paper/20 h-4 w-5/6 rounded" />
              <div className="bg-paper/20 h-4 w-4/6 rounded" />
            </div>
            <div className="bg-paper/20 h-3 w-24 rounded mt-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
