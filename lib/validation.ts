import type { ComplimentOutput, RulesSatisfied } from "./types";

/**
 * The rules layer — what we can honestly verify in code.
 *
 * Tier 1 (deterministic): rule 5 word count, rule 6 banned word.
 * Tier 2 (code-assisted): each evidence quote must appear in the compliment
 *   text — catches hallucinated evidence.
 * Tier 3 (prompt-enforced only): rules 1, 7, 8 and the *quality* of 2/3/4.
 *   Deliberately not validated here; the README documents this gap honestly.
 */

export type Violation =
  | { kind: "word_count"; count: number }
  | { kind: "banned_word" }
  | { kind: "evidence_mismatch"; field: keyof RulesSatisfied };

export const MAX_WORDS = 40;

/**
 * Word-count convention (documented in the README): split on whitespace; a
 * token counts iff it contains at least one letter or digit. "0.4%" = 1 word;
 * a bare "—" = 0; "world-class" = 1.
 */
export function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** Rule 6 bans the word "literally" — not the stem ("literal" is fine). */
const BANNED_WORD = /\bliterally\b/iu;

export function hasBannedWord(text: string): boolean {
  return BANNED_WORD.test(text);
}

/** Normalize for evidence matching: lowercase, collapse whitespace, straighten smart quotes. */
function normalize(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/** Tier 2: does the evidence quote actually appear in the compliment text? */
export function evidenceAppearsInText(evidence: string, text: string): boolean {
  const needle = normalize(evidence);
  return needle.length > 0 && normalize(text).includes(needle);
}

export function validateCompliment(compliment: ComplimentOutput): Violation[] {
  const violations: Violation[] = [];

  const words = countWords(compliment.text);
  if (words > MAX_WORDS) {
    violations.push({ kind: "word_count", count: words });
  }
  if (hasBannedWord(compliment.text)) {
    violations.push({ kind: "banned_word" });
  }
  for (const field of [
    "job_reference",
    "absurd_metaphor",
    "fake_statistic",
  ] as const) {
    if (!evidenceAppearsInText(compliment.rules_satisfied[field], compliment.text)) {
      violations.push({ kind: "evidence_mismatch", field });
    }
  }

  return violations;
}
