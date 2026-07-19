import { GUIDELINES } from "./guidelines";
import type { ComplimentOutput } from "./types";

/**
 * The rules layer — what we can honestly verify in code. Every check is driven
 * by the enforcement contracts in `lib/guidelines.ts`; this module just knows
 * how to enforce each *type*, not the specific rules.
 *
 * Tier 1 (deterministic): `word_cap`, `banned_word`.
 * Tier 2 (code-assisted): `evidence` — each quote must appear in the text.
 * Tier 3 (prompt-enforced only): `prompt_only` — deliberately not validated.
 */

export type Violation =
  | { kind: "word_cap"; ruleId: number; count: number; limit: number }
  | { kind: "banned_word"; ruleId: number; word: string }
  | { kind: "evidence_mismatch"; ruleId: number; field: string };

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word, case-insensitive match — bans the word, not the stem. */
export function hasBannedWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, "iu").test(text);
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

  for (const { id, enforcement } of GUIDELINES) {
    switch (enforcement.type) {
      case "word_cap": {
        const count = countWords(compliment.text);
        if (count > enforcement.limit) {
          violations.push({
            kind: "word_cap",
            ruleId: id,
            count,
            limit: enforcement.limit,
          });
        }
        break;
      }
      case "banned_word":
        if (hasBannedWord(compliment.text, enforcement.word)) {
          violations.push({ kind: "banned_word", ruleId: id, word: enforcement.word });
        }
        break;
      case "evidence": {
        const quote = compliment.rules_satisfied[enforcement.field] ?? "";
        if (!evidenceAppearsInText(quote, compliment.text)) {
          violations.push({
            kind: "evidence_mismatch",
            ruleId: id,
            field: enforcement.field,
          });
        }
        break;
      }
      case "prompt_only":
        break;
    }
  }

  return violations;
}
