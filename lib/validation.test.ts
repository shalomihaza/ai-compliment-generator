import { describe, expect, it } from "vitest";
import { GUIDELINES } from "./guidelines";
import type { ComplimentOutput } from "./types";
import {
  countWords,
  evidenceAppearsInText,
  hasBannedWord,
  validateCompliment,
} from "./validation";

describe("countWords", () => {
  it("counts plain words", () => {
    expect(countWords("the pigeons sensing greatness disperse")).toBe(5);
  });

  it("counts a statistic like 0.4% as one word", () => {
    expect(countWords("top 0.4% of spreadsheet whisperers")).toBe(5);
  });

  it("does not count bare punctuation tokens", () => {
    expect(countWords("dawn — the inspector approaches")).toBe(4);
  });

  it("counts hyphenated compounds as one word", () => {
    expect(countWords("a world-class ledger-balancer")).toBe(3);
  });

  it("handles leading/trailing/multiple whitespace", () => {
    expect(countWords("  two   words  ")).toBe(2);
  });

  it("returns 0 for empty and punctuation-only strings", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("— … !!")).toBe(0);
  });
});

describe("hasBannedWord", () => {
  it("flags the banned word in any case", () => {
    expect(hasBannedWord("she is literally a legend", "literally")).toBe(true);
    expect(hasBannedWord("LITERALLY unstoppable", "literally")).toBe(true);
  });

  it("flags it adjacent to punctuation", () => {
    expect(hasBannedWord("Literally, the best.", "literally")).toBe(true);
  });

  it("bans the word, not the stem", () => {
    expect(hasBannedWord("a literal mountain of invoices", "literally")).toBe(false);
    expect(hasBannedWord("her literalism is renowned", "literally")).toBe(false);
  });

  it("does not flag clean text", () => {
    expect(hasBannedWord("figuratively a hurricane of competence", "literally")).toBe(
      false,
    );
  });

  it("is parametric — enforces whatever word the guideline configures", () => {
    expect(hasBannedWord("you are amazing", "amazing")).toBe(true);
    expect(hasBannedWord("you are amazing", "literally")).toBe(false);
  });

  it("escapes regex metacharacters so they match literally", () => {
    // The "." must match a real dot, not any character.
    expect(hasBannedWord("built with a.i today", "a.i")).toBe(true);
    expect(hasBannedWord("built with axi today", "a.i")).toBe(false);
  });
});

describe("evidenceAppearsInText", () => {
  const text =
    "City records show a 99.1% “plumbing-serenity” rating under her watch.";

  it("matches verbatim quotes", () => {
    expect(evidenceAppearsInText("a 99.1%", text)).toBe(true);
  });

  it("matches across case and smart-quote differences", () => {
    expect(
      evidenceAppearsInText('99.1% "plumbing-serenity" RATING', text),
    ).toBe(true);
  });

  it("matches across collapsed whitespace", () => {
    expect(evidenceAppearsInText("city   records show", text)).toBe(true);
  });

  it("rejects paraphrased evidence", () => {
    expect(evidenceAppearsInText("a serenity score of 99.1", text)).toBe(false);
  });

  it("rejects empty evidence", () => {
    expect(evidenceAppearsInText("", text)).toBe(false);
    expect(evidenceAppearsInText("   ", text)).toBe(false);
  });
});

/**
 * These assert the validator is genuinely driven by lib/guidelines.ts — its
 * thresholds and fields come from the data, not from constants in this module.
 */
describe("validateCompliment is guideline-driven", () => {
  const wordCap = GUIDELINES.find((g) => g.enforcement.type === "word_cap");
  const bannedWordRule = GUIDELINES.find(
    (g) => g.enforcement.type === "banned_word",
  );
  const evidenceFields = GUIDELINES.flatMap((g) =>
    g.enforcement.type === "evidence" ? [g.enforcement.field] : [],
  );

  /** A compliment whose evidence quotes all appear verbatim in the text. */
  function cleanCompliment(text: string): ComplimentOutput {
    return {
      register: "test",
      text,
      rules_satisfied: Object.fromEntries(
        evidenceFields.map((field) => [field, text.split(" ").slice(0, 2).join(" ")]),
      ),
    };
  }

  it("passes a compliant compliment with no violations", () => {
    expect(validateCompliment(cleanCompliment("perfectly balanced ledgers reconciled"))).toEqual(
      [],
    );
  });

  it("flags a word_cap violation using the guideline's own limit", () => {
    if (wordCap?.enforcement.type !== "word_cap") throw new Error("no word_cap rule");
    const limit = wordCap.enforcement.limit;
    const text = Array.from({ length: limit + 3 }, () => "word").join(" ");
    const violations = validateCompliment(cleanCompliment(text));
    const wordViolation = violations.find((v) => v.kind === "word_cap");
    expect(wordViolation).toMatchObject({ limit, count: limit + 3, ruleId: wordCap.id });
  });

  it("flags the configured banned word", () => {
    if (bannedWordRule?.enforcement.type !== "banned_word")
      throw new Error("no banned_word rule");
    const word = bannedWordRule.enforcement.word;
    const violations = validateCompliment(cleanCompliment(`you are ${word} great`));
    expect(violations).toContainEqual({ kind: "banned_word", ruleId: bannedWordRule.id, word });
  });

  it("flags an evidence quote that is not in the text", () => {
    const compliment = cleanCompliment("dawn breaks over the ledger");
    if (evidenceFields.length === 0) throw new Error("no evidence rules");
    compliment.rules_satisfied[evidenceFields[0]] = "nowhere in the text";
    const violations = validateCompliment(compliment);
    expect(violations.some((v) => v.kind === "evidence_mismatch")).toBe(true);
  });
});
