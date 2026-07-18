import { describe, expect, it } from "vitest";
import {
  countWords,
  evidenceAppearsInText,
  hasBannedWord,
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
  it("flags 'literally' in any case", () => {
    expect(hasBannedWord("she is literally a legend")).toBe(true);
    expect(hasBannedWord("LITERALLY unstoppable")).toBe(true);
  });

  it("flags it adjacent to punctuation", () => {
    expect(hasBannedWord("Literally, the best.")).toBe(true);
  });

  it("does not flag 'literal' or 'literalism' — the rule bans the word, not the stem", () => {
    expect(hasBannedWord("a literal mountain of invoices")).toBe(false);
    expect(hasBannedWord("her literalism is renowned")).toBe(false);
  });

  it("does not flag clean text", () => {
    expect(hasBannedWord("figuratively a hurricane of competence")).toBe(false);
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
