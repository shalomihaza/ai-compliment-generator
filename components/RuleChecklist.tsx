"use client";

import { useState } from "react";
import { BRAND_RULES } from "@/lib/prompts";
import { countWords, MAX_WORDS } from "@/lib/validation";
import type { DisplayCompliment, RulesSatisfied } from "@/lib/types";

/**
 * Honest badge row. Verified rules (quote-checked or mechanically checked)
 * get a green ✓ badge; quote-verified badges expand to show their verbatim
 * evidence. Prompt-enforced rules get a visibly weaker ◌ treatment — no
 * checkmark the code can't back up.
 */

type Badge = {
  rule: number;
  label: string;
  tier: "quoted" | "verified" | "prompt";
  quoted?: keyof RulesSatisfied;
  detail?: (compliment: DisplayCompliment) => string;
};

const BADGES: Badge[] = [
  { rule: 2, label: "Job-Specific", tier: "quoted", quoted: "job_reference" },
  {
    rule: 3,
    label: "Absurd Metaphor",
    tier: "quoted",
    quoted: "absurd_metaphor",
  },
  {
    rule: 4,
    label: "Fake Statistic",
    tier: "quoted",
    quoted: "fake_statistic",
  },
  {
    rule: 5,
    label: `Under ${MAX_WORDS} Words`,
    tier: "verified",
    detail: (c) => `${countWords(c.text)}/${MAX_WORDS} words — verified`,
  },
  {
    rule: 6,
    label: 'No "Literally"',
    tier: "verified",
    detail: () => "no banned words — verified",
  },
  { rule: 1, label: "Appearance-Free", tier: "prompt" },
  { rule: 7, label: "No Celebrity Comps", tier: "prompt" },
  { rule: 8, label: "Workplace Safe", tier: "prompt" },
];

const PROMPT_TITLE = "Requested in the prompt — not machine-verified";

export function RuleChecklist({ compliment }: { compliment: DisplayCompliment }) {
  const [openRule, setOpenRule] = useState<number | null>(null);
  const open = BADGES.find((badge) => badge.rule === openRule);

  return (
    <div className="border-t border-line pt-3">
      <div className="flex flex-wrap gap-1.5">
        {BADGES.map((badge) =>
          badge.tier === "prompt" ? (
            <span
              key={badge.rule}
              title={`${BRAND_RULES[badge.rule - 1]} — ${PROMPT_TITLE}`}
              className="text-[11px] font-semibold rounded-full px-2.5 py-1 ring-1 ring-line ring-dashed text-text-faint"
            >
              <span aria-hidden>◌</span> {badge.label}
            </span>
          ) : (
            <button
              key={badge.rule}
              type="button"
              onClick={() =>
                setOpenRule((rule) => (rule === badge.rule ? null : badge.rule))
              }
              aria-expanded={openRule === badge.rule}
              title={BRAND_RULES[badge.rule - 1]}
              className={`text-[11px] font-semibold rounded-full px-2.5 py-1 bg-success/10 text-success ring-1 ring-success/25 hover:ring-success/50 active:scale-95 transition ${
                openRule === badge.rule ? "ring-success/60" : ""
              }`}
            >
              <span aria-hidden>✓</span> {badge.label}
            </button>
          ),
        )}
      </div>

      {open && (
        <p className="mt-2 text-xs text-text-soft">
          {open.quoted ? (
            <>
              Evidence:{" "}
              <em className="font-display text-sm text-text-strong">
                “{compliment.rulesSatisfied[open.quoted]}”
              </em>
            </>
          ) : (
            open.detail?.(compliment)
          )}
        </p>
      )}

      <p className="mt-2 text-[10px] text-text-faint">
        ✓ machine-verified · ◌ styled, not verified
      </p>
    </div>
  );
}
