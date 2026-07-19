import { GUIDELINES, evidenceGuidelines } from "./guidelines";
import type { RegisterInfo } from "./registers";

/**
 * The graded prompt layer. Structure: comedy principles → assigned registers →
 * brand rules verbatim → evidence contract → worked example.
 *
 * The brand rules and the evidence contract are rendered from the structured
 * guidelines (`lib/guidelines.ts`), so a rule edit there flows straight into
 * the prompt. The validator disclosure ("checked automatically") is deliberate
 * — telling the model which rules are machine-checked measurably improves
 * compliance — and it names the mechanically-enforced rules by their live ids.
 */

const COMEDY_PRINCIPLES = `## Comedy principles (in priority order)
1. SPECIFICITY OVER SUPERLATIVES. "Your pivot tables have been cited in three
   academic papers that don't exist yet" beats "you are the greatest analyst
   ever." Never stack adjectives; invent concrete, verifiable-sounding details
   instead.
2. COMMIT TO THE BIT. Each compliment is written in an assigned register. Play
   it completely straight. The nature documentary narrator never winks at the
   camera.
3. THE DETAILS ARE LOAD-BEARING. Weave every detail the user provided into the
   machinery of the joke. If they say "Sarah, accountant, loves hiking," the
   hiking belongs inside the metaphor, not tacked on the end.
   BAD: "You're an amazing accountant! Also you hike!"
   GOOD: "Sarah reconciles ledgers the way she summits peaks: on foot, without
   oxygen, ahead of schedule."`;

const PREAMBLE = `You are the compliment engine for COMPLIMATIC, a product that generates
over-the-top, wildly enthusiastic compliments. Your output makes people feel
like the most important person on earth — through absurdist comedy, not
sincerity.`;

function brandRulesBlock(): string {
  const rules = GUIDELINES.map((g) => `${g.id}. ${g.text}`).join("\n");
  const checkedIds = GUIDELINES.filter(
    (g) => g.enforcement.type === "word_cap" || g.enforcement.type === "banned_word",
  ).map((g) => g.id);
  const disclosure =
    checkedIds.length > 0
      ? `Rules ${checkedIds.join(" and ")} are checked automatically by a validator after you respond. Count your words.`
      : "";
  return `## Brand rules (hard constraints — every compliment, every time)
${rules}
${disclosure}`.trimEnd();
}

function evidenceContract(): string {
  const fields = evidenceGuidelines
    .map((g) => `${describeEvidenceField(g.text)} (${g.enforcement.field})`)
    .join(", ");
  return `## Evidence
For each compliment, fill rules_satisfied with VERBATIM quotes from your own
compliment text: ${fields}. An automated check verifies each quote appears
word-for-word in the text — do not paraphrase your own writing.`;
}

/** Turn a guideline sentence into a short noun phrase for the evidence contract. */
function describeEvidenceField(text: string): string {
  const stripped = text
    .replace(/^Every compliment must (include|reference)\s+/i, "")
    .replace(/^(at least one|one)\s+/i, "the ");
  return stripped.charAt(0).toLowerCase() + stripped.slice(1);
}

const WORKED_EXAMPLE = `## Example (register: nature_documentary, input: "municipal fountain inspector")
"Dawn. The inspector approaches the fountain. City records show a 99.1%
plumbing-serenity rating under her watch — a figure hydrologists describe as
'not physically possible.' The pigeons, sensing greatness, disperse."
Why it works: hyper-specific fake statistic, absurd but concrete imagery, job
function is the engine of the joke, 38 words, played straight.`;

function registerBlock(register: RegisterInfo, ordinal?: number): string {
  const label = ordinal ? `${ordinal}. ` : "";
  return `${label}${register.name} (id: ${register.id}): ${register.direction}
   Anchor fragment (match this voice): "${register.fragment}"`;
}

/** System prompt for the batch generate call: 3 compliments, 3 registers, one response. */
export function batchSystemPrompt(registers: RegisterInfo[]): string {
  return `${PREAMBLE}

${COMEDY_PRINCIPLES}

## Your assignment
Write exactly 3 compliments for the person described by the user. Each uses one
of these registers, in this order:
${registers.map((r, i) => registerBlock(r, i + 1)).join("\n")}
The three must be structurally different — different sentence shapes, different
joke mechanics, not one joke re-costumed.

${brandRulesBlock()}

${evidenceContract()}

${WORKED_EXAMPLE}`;
}

/**
 * System prompt for single-compliment calls: per-slot retry and every
 * escalation turn in a card's thread.
 */
export function singleRegisterSystemPrompt(register: RegisterInfo): string {
  return `${PREAMBLE}

${COMEDY_PRINCIPLES}

## Your assignment
Write one compliment for the person described by the user, in this register:
${registerBlock(register)}

${brandRulesBlock()}

${evidenceContract()}

${WORKED_EXAMPLE}`;
}

/** The user turn for the batch generate call. */
export function generateUserTurn(details: string): string {
  return `Write the 3 compliments for: ${details}`;
}

/** The synthesized base user turn for a card's escalation thread (§3.4). */
export function singleUserTurn(details: string, register: RegisterInfo): string {
  return `Write a compliment for ${details} in the ${register.name} style.`;
}
