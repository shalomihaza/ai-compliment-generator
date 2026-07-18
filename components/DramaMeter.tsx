"use client";

import { MAX_LEVEL } from "@/lib/escalation";

/** Amber → ember heat as the level climbs. */
const HEAT = [
  "bg-gold",
  "bg-gold",
  "bg-ember",
  "bg-heat-4",
  "bg-heat-5",
] as const;

export function DramaMeter({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-faded">
        Drama
      </span>
      <div className="flex gap-1" aria-label={`Drama level ${level} of ${MAX_LEVEL}`}>
        {Array.from({ length: MAX_LEVEL }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-5 rounded-xs transition-colors duration-500 ${
              i < level ? HEAT[i] : "bg-paper-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
