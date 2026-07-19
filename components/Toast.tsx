"use client";

import type { ToastData } from "@/hooks/useToast";

export function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <div role="status" aria-live="polite">
      {toast && (
        <div
          key={toast.id}
          className="toast-in fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-xl ring-1 ring-line shadow-xl shadow-coral/10 rounded-full px-5 py-3 text-sm font-semibold text-text-strong"
        >
          <span aria-hidden>💌</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
