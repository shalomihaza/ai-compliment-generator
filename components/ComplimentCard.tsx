"use client";

import { useState } from "react";
import { DramaMeter } from "./DramaMeter";
import { RuleChecklist } from "./RuleChecklist";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { escalateButtonLabel, MAX_LEVEL } from "@/lib/escalation";
import type { CardData } from "./ComplimentApp";

const ESCALATING_LINES = [
  "Consulting higher powers…",
  "Requisitioning additional drama…",
  "Notifying the relevant authorities…",
  "Amplifying beyond safe limits…",
];

export function ComplimentCard({
  card,
  onEscalate,
}: {
  card: Extract<CardData, { status: "ready" | "escalating" | "escalate_failed" }>;
  onEscalate: () => void;
}) {
  const { state: copyState, copy } = useCopyToClipboard();
  const [escalatingLine, setEscalatingLine] = useState(ESCALATING_LINES[0]);

  const escalating = card.status === "escalating";
  const retired = card.level >= MAX_LEVEL;

  function escalate() {
    setEscalatingLine(
      ESCALATING_LINES[Math.floor(Math.random() * ESCALATING_LINES.length)],
    );
    onEscalate();
  }

  return (
    <article
      className={`bg-paper text-ink-on-paper rounded-lg p-5 flex flex-col gap-4 ${
        escalating ? "escalating-pulse" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 bg-paper-dim border border-paper-line rounded-full px-3 py-1 text-xs uppercase tracking-wider">
          <span aria-hidden>{card.register.emoji}</span>
          {card.register.name}
        </span>
        <DramaMeter level={card.level} />
      </header>

      <button
        type="button"
        onClick={() => copy(card.current.text)}
        title="Click to copy"
        className="text-left font-display text-lg/relaxed hover:opacity-80 transition-opacity cursor-copy"
      >
        {card.current.text}
      </button>

      <RuleChecklist compliment={card.current} />

      <footer className="flex items-center gap-2 mt-auto">
        <button
          type="button"
          onClick={escalate}
          disabled={escalating || retired}
          className={`flex-1 text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-sm transition-colors ${
            retired
              ? "bg-paper-dim text-faded cursor-not-allowed"
              : "bg-ink text-paper hover:bg-ember disabled:opacity-70"
          }`}
        >
          {escalating ? escalatingLine : escalateButtonLabel(card.level)}
        </button>
        <button
          type="button"
          onClick={() => copy(card.current.text)}
          className="border border-paper-line rounded-sm px-3 py-2.5 text-xs uppercase tracking-widest hover:bg-paper-dim transition-colors min-w-20"
        >
          {copyState === "copied"
            ? "✓ Copied!"
            : copyState === "failed"
              ? "Select text"
              : "Copy"}
        </button>
      </footer>

      {card.status === "escalate_failed" && card.escalateError && (
        <p className="text-xs text-ember border-t border-paper-line pt-3">
          {card.escalateError} <span className="text-faded">Try again?</span>
        </p>
      )}
    </article>
  );
}
