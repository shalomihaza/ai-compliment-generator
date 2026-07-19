/**
 * The escalation ladder. Level = number of escalations performed so far;
 * pressing the button at level N sends the level N+1 instruction as a user
 * turn on the card's thread. After level 5 the button retires.
 */

export const MAX_LEVEL = 5;

const REASSERT = `Same register, same person. Under 40 words. All brand rules
still apply — including a fresh made-up statistic quoted as evidence. Escalate
specificity and absurdity density, not adjectives.`;

const LADDER: Record<number, string> = {
  1: `Escalate this compliment to LOCAL-WORLD SCALE: the office, the industry,
the city itself now reacts to this person. ${REASSERT}`,
  2: `Escalate further, to INSTITUTIONAL SCALE: governments, academies, or
international bodies are now involved or alarmed. You MUST invent a new,
bigger fake statistic. ${REASSERT}`,
  3: `Escalate further, to HISTORICAL-COSMIC SCALE: history books, celestial
bodies, the fabric of time itself acknowledges this person. The narrator
remains professional as reality bends. ${REASSERT}`,
  4: `Escalate further: REALITY IS STRAINING. Physics, language, or mathematics
struggle to contain this person. The register's narrator is barely holding
on. ${REASSERT}`,
  5: `FINAL FORM: transcendence. Write from beyond the concept of compliments —
somehow still workplace appropriate and in-register. This is the last
escalation; make it count. ${REASSERT}`,
};

export function ladderInstruction(level: number): string {
  const instruction = LADDER[level];
  if (!instruction) {
    throw new Error(`No ladder instruction for level ${level}`);
  }
  return instruction;
}

/**
 * Button caption shown at a given current level (before the next press). Kept
 * short so the button never wraps past one line — it must stay the same height
 * as the Copy button beside it. The last entry is the retired/disabled state.
 */
export function escalateButtonLabel(level: number): string {
  const labels = [
    "Make it dramatic",
    "More drama",
    "Even more",
    "Too far?",
    "Final form",
    "Maxed out",
  ];
  return labels[Math.min(level, MAX_LEVEL)];
}
