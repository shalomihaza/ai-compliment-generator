"use client";

import { BRAND_RULES } from "@/lib/prompts";
import { countWords, MAX_WORDS } from "@/lib/validation";
import type { DisplayCompliment, RulesSatisfied } from "@/lib/types";

/**
 * Quote-verified rules show their verbatim proof in always-visible rows; the
 * remaining rules render as uniform green ✓ badges (a deliberate visual-
 * consistency call). The verified/prompt-enforced distinction lives in each
 * badge's tooltip.
 */

const EVIDENCE_ROWS: { rule: number; label: string; field: keyof RulesSatisfied }[] = [
  { rule: 2, label: "Job-Specific", field: "job_reference" },
  { rule: 3, label: "Absurd Metaphor", field: "absurd_metaphor" },
  { rule: 4, label: "Fake Statistic", field: "fake_statistic" },
];

const PROMPT_TITLE = "Requested in the prompt — not machine-verified";

const BADGES: {
  rule: number;
  label: string;
  detail: (compliment: DisplayCompliment) => string;
}[] = [
  {
    rule: 5,
    label: `Under ${MAX_WORDS} Words`,
    detail: (c) => `${countWords(c.text)}/${MAX_WORDS} words, verified`,
  },
  {
    rule: 6,
    label: 'No "Literally"',
    detail: () => "no banned words, verified",
  },
  { rule: 1, label: "Appearance-Free", detail: () => PROMPT_TITLE },
  { rule: 7, label: "No Celebrity Comps", detail: () => PROMPT_TITLE },
  { rule: 8, label: "Workplace Safe", detail: () => PROMPT_TITLE },
];

export function RuleChecklist({ compliment }: { compliment: DisplayCompliment }) {
  return (
    <div className="border-t border-line pt-3 flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {EVIDENCE_ROWS.map(({ rule, label, field }) => (
          <li
            key={rule}
            title={BRAND_RULES[rule - 1]}
            className="text-[11px] font-semibold text-text-soft"
          >
            <span className="text-success" aria-hidden>
              ✓
            </span>{" "}
            {label}{" "}
            <em className="font-display font-normal text-sm text-text-strong">
              “{compliment.rulesSatisfied[field]}”
            </em>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5">
        {BADGES.map(({ rule, label, detail }) => (
          <span
            key={rule}
            title={`${BRAND_RULES[rule - 1]} — ${detail(compliment)}`}
            className="text-[11px] font-semibold rounded-full px-2.5 py-1 bg-success/10 text-success ring-1 ring-success/25"
          >
            <span aria-hidden>✓</span> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
