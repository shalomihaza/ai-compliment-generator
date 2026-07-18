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
    <article className="border border-dashed border-ink-line bg-ink-soft rounded-lg p-5 flex flex-col gap-4 min-h-60">
      <span className="inline-flex self-start items-center gap-1.5 border border-ink-line rounded-full px-3 py-1 text-xs uppercase tracking-wider text-paper/70">
        <span aria-hidden>{card.register.emoji}</span>
        {card.register.name}
      </span>
      <div className="my-auto text-center">
        <p className="text-ember text-xs uppercase tracking-widest mb-2">
          Rejected
        </p>
        <p className="font-display italic text-paper/80">
          This compliment was rejected by the Brand Compliance Bureau.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={card.retrying}
        className="border border-gold text-gold text-xs uppercase tracking-widest px-4 py-2.5 rounded-sm hover:bg-gold hover:text-ink transition-colors disabled:opacity-60"
      >
        {card.retrying ? "Appealing the decision…" : "Appeal the decision"}
      </button>
    </article>
  );
}
