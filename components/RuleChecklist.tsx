"use client";

import { useState } from "react";
import { BRAND_RULES } from "@/lib/prompts";
import { countWords, MAX_WORDS } from "@/lib/validation";
import type { DisplayCompliment, RulesSatisfied } from "@/lib/types";

/**
 * Collapsed: a "Brand compliant" stamp. Expanded: all 8 rules with how each
 * was satisfied — evidence rules show their verbatim quote, mechanical rules
 * show the verified facts (quietly advertising the real validator), and
 * prompt-enforced rules say so honestly.
 */

type RuleRow = {
  rule: number;
  detail: (compliment: DisplayCompliment) => string;
  quoted?: keyof RulesSatisfied;
};

const RULE_ROWS: RuleRow[] = [
  { rule: 1, detail: () => "prompt-enforced" },
  { rule: 2, detail: () => "", quoted: "job_reference" },
  { rule: 3, detail: () => "", quoted: "absurd_metaphor" },
  { rule: 4, detail: () => "", quoted: "fake_statistic" },
  {
    rule: 5,
    detail: (c) => `${countWords(c.text)}/${MAX_WORDS} words — verified`,
  },
  { rule: 6, detail: () => "no banned words — verified" },
  { rule: 7, detail: () => "prompt-enforced" },
  { rule: 8, detail: () => "prompt-enforced" },
];

export function RuleChecklist({ compliment }: { compliment: DisplayCompliment }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-paper-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 text-xs uppercase tracking-widest text-ok hover:text-ink-on-paper transition-colors"
      >
        <span aria-hidden>✓</span>
        Brand compliant
        <span className="text-faded normal-case tracking-normal">
          {open ? "hide rules" : "show rules"}
        </span>
      </button>

      {open && (
        <ol className="mt-3 space-y-2 text-xs text-ink-on-paper">
          {RULE_ROWS.map(({ rule, detail, quoted }) => (
            <li key={rule} className="flex gap-2">
              <span className="text-ok shrink-0" aria-hidden>
                ✓
              </span>
              <span>
                <span className="text-faded">
                  {rule}. {BRAND_RULES[rule - 1]}
                </span>{" "}
                {quoted ? (
                  <em className="font-display">
                    “{compliment.rulesSatisfied[quoted]}”
                  </em>
                ) : (
                  <span className="text-faded/80">— {detail(compliment)}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
