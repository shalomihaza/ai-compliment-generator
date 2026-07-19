import { callStructuredWithRetry } from "./gemini";
import { ComplimentSchema, type ComplimentOutput, type Message } from "./types";
import { validateCompliment, type Violation } from "./validation";

/**
 * Surgical repair: one follow-up turn listing ONLY the violations, with exact
 * numbers. Never regenerate on violation — the repair preserves the joke. Every
 * message is built from the violation's own parameters, so it stays accurate
 * when the brand team retunes a guideline.
 */

function describeViolation(violation: Violation): string {
  switch (violation.kind) {
    case "word_cap":
      return `Your compliment is ${violation.count} words. The hard limit is ${violation.limit}. Cut ${
        violation.count - violation.limit
      } or more words by compressing phrasing — do not remove the metaphor, the statistic, or the job reference.`;
    case "banned_word":
      return `Contains the banned word "${violation.word}". Remove or replace it without weakening the sentence.`;
    case "evidence_mismatch":
      return `Your "${violation.field}" evidence quote does not appear verbatim in the compliment text. Re-quote the exact phrase.`;
  }
}

const PREAMBLE =
  "Fix ONLY the following, changing nothing else — same register, same jokes, same structure. Respond in the same JSON format.";

/** Repair message for a single-compliment call (escalation / per-slot retry). */
export function buildRepairMessage(violations: Violation[]): string {
  return `${PREAMBLE}\n${violations.map((v) => `- ${describeViolation(v)}`).join("\n")}`;
}

/**
 * Repair message for the batch generate call: one follow-up turn covering
 * every violating compliment, addressed by position.
 */
export function buildBatchRepairMessage(
  violationsBySlot: Map<number, Violation[]>,
): string {
  const sections = [...violationsBySlot.entries()].map(
    ([slot, violations]) =>
      `Compliment ${slot + 1} violated:\n${violations
        .map((v) => `- ${describeViolation(v)}`)
        .join("\n")}`,
  );
  return `${PREAMBLE} Return all 3 compliments, keeping the compliant ones identical.\n${sections.join("\n")}`;
}

/**
 * The single-compliment retry policy (§6, hard caps — never loop):
 * call → validate → at most ONE in-thread repair turn → re-validate → if still
 * dirty, fail honestly. Used by escalation and per-slot retry.
 */
export async function generateCleanCompliment(args: {
  system: string;
  messages: Message[];
}): Promise<{ ok: true; compliment: ComplimentOutput } | { ok: false }> {
  const first = await callStructuredWithRetry({
    system: args.system,
    messages: args.messages,
    schema: ComplimentSchema,
  });

  let violations = validateCompliment(first.parsed);
  if (violations.length === 0) return { ok: true, compliment: first.parsed };

  const second = await callStructuredWithRetry({
    system: args.system,
    messages: [
      ...args.messages,
      { role: "assistant", content: first.rawText },
      { role: "user", content: buildRepairMessage(violations) },
    ],
    schema: ComplimentSchema,
  });

  violations = validateCompliment(second.parsed);
  if (violations.length === 0) return { ok: true, compliment: second.parsed };

  // Drop, don't lie: a checkmark next to a violated rule is a visible lie.
  console.error("compliment rejected after repair", violations);
  return { ok: false };
}
