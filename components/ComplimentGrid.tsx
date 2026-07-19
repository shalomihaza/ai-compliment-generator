"use client";

import { useState } from "react";
import { ComplimentCard } from "./ComplimentCard";
import { RejectedCard } from "./RejectedCard";
import type { CardData } from "./ComplimentApp";

export function ComplimentGrid({
  cards,
  onEscalate,
  onRetrySlot,
  onToast,
}: {
  cards: CardData[];
  onEscalate: (card: CardData) => void;
  onRetrySlot: (card: CardData) => void;
  onToast: (message: string) => void;
}) {
  // One global toggle for all three cards — collapsing them together keeps the
  // row the same height. Defaults open so the rules are shown, per the brief.
  const [rulesExpanded, setRulesExpanded] = useState(true);

  return (
    <div className="mt-12">
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setRulesExpanded((value) => !value)}
          aria-pressed={rulesExpanded}
          className="text-xs font-semibold text-text-soft ring-1 ring-line rounded-full px-3 py-1.5 hover:bg-surface-soft active:scale-95 transition"
        >
          {rulesExpanded ? "Hide brand rules" : "Show brand rules"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {cards.map((card) => (
          <div
            key={`${card.slot}-${card.register.id}`}
            className="card-in h-full"
            style={{ animationDelay: `${card.slot * 0.1}s` }}
          >
            {card.status === "rejected" ? (
              <RejectedCard card={card} onRetry={() => onRetrySlot(card)} />
            ) : (
              <ComplimentCard
                card={card}
                rulesExpanded={rulesExpanded}
                onEscalate={() => onEscalate(card)}
                onToast={onToast}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
