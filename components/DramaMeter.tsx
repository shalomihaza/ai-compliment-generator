"use client";

import { MAX_LEVEL } from "@/lib/escalation";

/** Peach → violet heat as the level climbs past safe limits. */
const HEAT = [
  "bg-heat-1",
  "bg-heat-2",
  "bg-heat-3",
  "bg-heat-4",
  "bg-heat-5",
] as const;

export function DramaMeter({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-faint">
        Drama
      </span>
      <div className="flex gap-1" aria-label={`Drama level ${level} of ${MAX_LEVEL}`}>
        {Array.from({ length: MAX_LEVEL }, (_, i) => (
          <span
            // Re-key a pip when it fills so pip-pop re-fires.
            key={`${i}-${i < level}`}
            className={`h-2.5 w-2.5 rounded-full ${
              i < level ? `${HEAT[i]} pip-pop` : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
