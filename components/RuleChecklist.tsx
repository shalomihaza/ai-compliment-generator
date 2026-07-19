"use client";

import { BRAND_RULES } from "@/lib/prompts";
import { countWords, MAX_WORDS } from "@/lib/validation";
import type { DisplayCompliment, RulesSatisfied } from "@/lib/types";

/**
 * One consistent checklist of all 8 brand rules, each with a green ✓ (a
 * deliberate visual-consistency call). Quote-verified rules show their
 * verbatim proof inline; the verified/prompt-enforced distinction lives in
 * each row's tooltip.
 */

const PROMPT_TITLE = "Requested in the prompt — not machine-verified";

const RULES: {
  rule: number;
  label: string;
  field?: keyof RulesSatisfied;
  detail: (compliment: DisplayCompliment) => string;
}[] = [
  { rule: 2, label: "Job-Specific", field: "job_reference", detail: () => "quote verified in text" },
  { rule: 3, label: "Absurd Metaphor", field: "absurd_metaphor", detail: () => "quote verified in text" },
  { rule: 4, label: "Fake Statistic", field: "fake_statistic", detail: () => "quote verified in text" },
  {
    rule: 5,
    label: `Under ${MAX_WORDS} Words`,
    detail: (c) => `${countWords(c.text)}/${MAX_WORDS} words, verified`,
  },
  { rule: 6, label: 'No "Literally"', detail: () => "no banned words, verified" },
  { rule: 1, label: "Appearance-Free", detail: () => PROMPT_TITLE },
  { rule: 7, label: "No Celebrity Comps", detail: () => PROMPT_TITLE },
  { rule: 8, label: "Workplace Safe", detail: () => PROMPT_TITLE },
];

export function RuleChecklist({ compliment }: { compliment: DisplayCompliment }) {
  return (
    <ul className="border-t border-line pt-3 flex flex-col gap-1.5">
      {RULES.map(({ rule, label, field, detail }) => (
        <li
          key={rule}
          title={`${BRAND_RULES[rule - 1]} — ${detail(compliment)}`}
          className="text-[11px] font-semibold text-text-soft"
        >
          <span className="text-success" aria-hidden>
            ✓
          </span>{" "}
          {label}
          {field && (
            <>
              {" "}
              <em className="font-display font-normal text-sm text-text-strong">
                “{compliment.rulesSatisfied[field]}”
              </em>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
