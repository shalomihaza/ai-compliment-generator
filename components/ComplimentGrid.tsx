"use client";

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
  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {cards.map((card) => (
        <div
          key={`${card.slot}-${card.register.id}`}
          className="card-in"
          style={{ animationDelay: `${card.slot * 0.1}s` }}
        >
          {card.status === "rejected" ? (
            <RejectedCard card={card} onRetry={() => onRetrySlot(card)} />
          ) : (
            <ComplimentCard
              card={card}
              onEscalate={() => onEscalate(card)}
              onToast={onToast}
            />
          )}
        </div>
      ))}
    </div>
  );
}
