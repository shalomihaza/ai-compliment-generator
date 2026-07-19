"use client";

import { GUIDELINES, evidenceGuidelines, type Guideline } from "@/lib/guidelines";
import { countWords } from "@/lib/validation";
import type { DisplayCompliment } from "@/lib/types";

/**
 * The on-card brand-rule display, driven entirely by `lib/guidelines.ts`.
 *
 * Expanded (default): every rule as a green-✓ row (a deliberate
 * visual-consistency call). Quote-verified rules show their verbatim proof
 * inline, mechanical rules show the verified fact, and the verified vs
 * prompt-enforced distinction lives in each row's tooltip. Verified rows lead.
 *
 * Collapsed (global toggle): a compact "Brand compliant" stamp plus just the
 * evidence quotes — enough to signal compliance and show the proof when the
 * user wants a cleaner card to read or share.
 */

const PROMPT_TITLE = "Requested in the prompt — not machine-verified";

/** Is this rule actually machine-verified (Tier 1/2) vs prompt-only (Tier 3)? */
function isVerified(guideline: Guideline): boolean {
  return guideline.enforcement.type !== "prompt_only";
}

/** The evidence quote for an evidence rule, else null. */
function evidenceQuote(
  guideline: Guideline,
  compliment: DisplayCompliment,
): string | null {
  return guideline.enforcement.type === "evidence"
    ? (compliment.rulesSatisfied[guideline.enforcement.field] ?? "")
    : null;
}

/** The tooltip detail — the verified fact, or the prompt-only disclosure. */
function detail(guideline: Guideline, compliment: DisplayCompliment): string {
  switch (guideline.enforcement.type) {
    case "evidence":
      return "quote verified in text";
    case "word_cap":
      return `${countWords(compliment.text)}/${guideline.enforcement.limit} words, verified`;
    case "banned_word":
      return "no banned words, verified";
    case "prompt_only":
      return PROMPT_TITLE;
  }
}

// Verified rules first, prompt-only last; stable within each group.
const ORDERED = [...GUIDELINES].sort(
  (a, b) => Number(isVerified(b)) - Number(isVerified(a)),
);

export function RuleChecklist({
  compliment,
  expanded,
}: {
  compliment: DisplayCompliment;
  expanded: boolean;
}) {
  if (!expanded) {
    return (
      <div className="border-t border-line pt-3 flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold text-success">
          <span aria-hidden>✓</span> Brand compliant
        </p>
        {evidenceGuidelines.map((guideline) => {
          const quote = compliment.rulesSatisfied[guideline.enforcement.field];
          if (!quote) return null;
          return (
            <p
              key={guideline.id}
              title={guideline.text}
              className="font-display text-sm text-text-strong"
            >
              “{quote}”
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <ul className="border-t border-line pt-3 flex flex-col gap-1.5">
      {ORDERED.map((guideline) => {
        const quote = evidenceQuote(guideline, compliment);
        return (
          <li
            key={guideline.id}
            title={`${guideline.text} — ${detail(guideline, compliment)}`}
            className="text-[11px] font-semibold text-text-soft"
          >
            <span className="text-success" aria-hidden>
              ✓
            </span>{" "}
            {guideline.label}
            {quote !== null && (
              <>
                {" "}
                <em className="font-display font-normal text-sm text-text-strong">
                  “{quote}”
                </em>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
