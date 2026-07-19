"use client";

import type { CardData } from "./ComplimentApp";

/**
 * A compliment (and its one repair) violated the brand rules, so the slot
 * fails honestly instead of showing a lying checkmark.
 */
export function RejectedCard({
  card,
  onRetry,
}: {
  card: Extract<CardData, { status: "rejected" }>;
  onRetry: () => void;
}) {
  return (
    <article className="h-full border-2 border-dashed border-line bg-white/50 rounded-2xl p-6 flex flex-col gap-4 min-h-60">
      <span className="inline-flex self-start items-center gap-1.5 bg-surface-soft ring-1 ring-line rounded-full px-3 py-1 text-xs font-semibold text-text-soft">
        <span aria-hidden>{card.register.emoji}</span>
        {card.register.name}
      </span>
      <div className="my-auto text-center">
        <p aria-hidden className="text-3xl mb-2">
          🙈
        </p>
        <p className="font-display text-lg text-text-strong">
          This one flopped.
        </p>
        <p className="mt-1 text-sm text-text-soft">
          The AI got a little too weird — even for us.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={card.retrying}
        className="ring-1 ring-coral text-coral text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-coral hover:text-white active:scale-95 transition disabled:opacity-60"
      >
        {card.retrying ? "Summoning a better one…" : "Give it another shot 🔁"}
      </button>
    </article>
  );
}
