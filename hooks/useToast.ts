"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastData = { id: number; message: string };

/**
 * One-at-a-time toast. The incrementing id lets the Toast component re-key
 * (and so re-animate) when the same message fires twice in a row.
 */
export function useToast(durationMs = 2400) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const showToast = useCallback(
    (message: string) => {
      nextId.current += 1;
      setToast({ id: nextId.current, message });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  return { toast, showToast };
}
