"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

/**
 * Clipboard with honest feedback: "copied" only when the write succeeded,
 * "failed" (→ "select the text" hint) when the browser refused. Local state
 * by design — copy feedback is not app state.
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      let ok: boolean;
      try {
        await navigator.clipboard.writeText(text);
        setState("copied");
        ok = true;
      } catch {
        setState("failed");
        ok = false;
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), resetAfterMs);
      return ok;
    },
    [resetAfterMs],
  );

  return { state, copy };
}
