"use client";

import { GUIDELINES, type Guideline } from "@/lib/guidelines";
import { countWords } from "@/lib/validation";
import type { DisplayCompliment } from "@/lib/types";

/**
 * One consistent checklist of every brand rule, each with a green ✓ (a
 * deliberate visual-consistency call). Every row is derived from
 * `lib/guidelines.ts`: quote-verified rules show their verbatim proof inline,
 * mechanical rules show the verified fact, and the verified/prompt-enforced
 * distinction lives in each row's tooltip. Verified rows come first so the
 * real machine checks lead.
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

export function RuleChecklist({ compliment }: { compliment: DisplayCompliment }) {
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
