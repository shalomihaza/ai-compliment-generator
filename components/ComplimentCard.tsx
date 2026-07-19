"use client";

import { useState } from "react";
import { DramaMeter } from "./DramaMeter";
import { RuleChecklist } from "./RuleChecklist";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { escalateButtonLabel, MAX_LEVEL } from "@/lib/escalation";
import type { CardData } from "./ComplimentApp";

const ESCALATING_LINES = [
  "Summoning drama… 🎭",
  "Cranking the dial… 🎚️",
  "More confetti… 🎉",
  "Amplifying… ⚡",
];

export function ComplimentCard({
  card,
  onEscalate,
  onToast,
}: {
  card: Extract<CardData, { status: "ready" | "escalating" | "escalate_failed" }>;
  onEscalate: () => void;
  onToast: (message: string) => void;
}) {
  const { state: copyState, copy } = useCopyToClipboard();
  const [escalatingLine, setEscalatingLine] = useState(ESCALATING_LINES[0]);

  const escalating = card.status === "escalating";
  const retired = card.level >= MAX_LEVEL;

  async function copyCompliment() {
    if (await copy(card.current.text)) {
      onToast("Copied! Go make someone's day 💌");
    }
  }

  function escalate() {
    setEscalatingLine(
      ESCALATING_LINES[Math.floor(Math.random() * ESCALATING_LINES.length)],
    );
    onEscalate();
  }

  return (
    <article
      className={`relative h-full bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-line p-6 flex flex-col gap-4 shadow-[0_8px_30px_-12px_rgb(255_107_107/0.15)] hover:-translate-y-1 hover:shadow-xl hover:shadow-coral/10 transition duration-300 ${
        escalating ? "glow-escalating" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 bg-surface-soft ring-1 ring-line rounded-full px-3 py-1 text-xs font-semibold text-text-soft">
          <span aria-hidden>{card.register.emoji}</span>
          {card.register.name}
        </span>
        <DramaMeter level={card.level} />
      </header>

      <p
        key={card.current.text}
        className="text-reveal font-display text-xl/relaxed text-text-strong"
      >
        {card.current.text}
      </p>

      <RuleChecklist compliment={card.current} />

      <footer className="flex items-center gap-2 mt-auto">
        <button
          type="button"
          onClick={escalate}
          disabled={escalating || retired}
          className={`flex-1 min-w-0 truncate text-sm font-bold px-4 py-3 rounded-xl transition ${
            retired
              ? "bg-surface-soft text-text-faint ring-1 ring-line cursor-not-allowed"
              : "grad-primary text-white shadow-md shadow-violet/25 cursor-pointer hover:shadow-lg hover:shadow-violet/30 active:scale-95 disabled:opacity-70"
          }`}
        >
          {escalating ? escalatingLine : escalateButtonLabel(card.level)}
        </button>
        <button
          type="button"
          onClick={copyCompliment}
          className="ring-1 ring-line rounded-xl px-4 py-3 text-sm font-semibold text-text-soft cursor-pointer hover:bg-surface-soft active:scale-95 transition min-w-20"
        >
          {copyState === "copied"
            ? "✓ Copied!"
            : copyState === "failed"
              ? "Select text"
              : "Copy"}
        </button>
      </footer>

      {card.status === "escalate_failed" && card.escalateError && (
        <p className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">
          <span aria-hidden>😅</span> The drama overloaded mid-flight.{" "}
          {card.escalateError}{" "}
          <span className="text-danger/70">Try again?</span>
        </p>
      )}
    </article>
  );
}
