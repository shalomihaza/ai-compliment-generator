"use client";

import { useEffect, useState } from "react";

const STATUS_LINES = [
  "Consulting the Council of Hyperbole…",
  "Measuring Greatness…",
  "Searching Parallel Universes…",
  "Bribing the Thesaurus…",
  "Inflating adjectives to regulation pressure…",
  "Recruiting a hype committee…",
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
    <div className="mt-12" role="status" aria-live="polite">
      <p
        key={lines[index]}
        className="line-in text-center text-coral text-sm font-semibold mb-8"
      >
        {lines[index]}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((slot) => (
          <div
            key={slot}
            className="card-in bg-white/70 backdrop-blur-xl ring-1 ring-line rounded-2xl p-6 h-72 shadow-lg shadow-coral/5"
            style={{ animationDelay: `${slot * 0.2}s` }}
          >
            <div className="shimmer h-6 w-32 rounded-full mb-6" />
            <div className="space-y-3">
              <div className="shimmer h-4 w-full rounded-full" />
              <div className="shimmer h-4 w-5/6 rounded-full" />
              <div className="shimmer h-4 w-4/6 rounded-full" />
            </div>
            <div className="shimmer h-5 w-40 rounded-full mt-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
