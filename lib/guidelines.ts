/**
 * The Compliment Style Guidelines as structured data — the single source that
 * drives the prompt, the response schema, the validator, the repair messages,
 * and the on-card checklist. A brand-team edit here updates every consumer at
 * once, so the text and its enforcement can never drift apart.
 *
 * Each rule declares BOTH its verbatim text AND an enforcement contract from a
 * closed set of types. That closed set is the honest boundary of the product:
 * code can only claim to *verify* rules whose enforcement type it implements,
 * so the brand team can retune parameters (the word cap, the banned word),
 * reword any rule, or add prompt-enforced rules with no deploy — but they can't
 * config-file their way into a machine-verified checkmark we haven't built.
 *
 * To make the guidelines truly externally managed (CMS / DB / hosted JSON),
 * only the loading of GUIDELINES would move behind a fetch + bundled fallback;
 * every consumer already reads from here. See the README ("considered and
 * deferred").
 */

export const GUIDELINES_VERSION = "2.1";

export type Enforcement =
  /** Tier 1: at most `limit` words (see countWords for the token convention). */
  | { type: "word_cap"; limit: number }
  /** Tier 1: the given word is banned (whole word, case-insensitive). */
  | { type: "banned_word"; word: string }
  /**
   * Tier 2: the model must quote its own text verbatim into `field`; a
   * substring check confirms the quote actually appears.
   */
  | { type: "evidence"; field: string; schemaDescription: string }
  /** Tier 3: prompt-enforced only — deliberately not machine-verified. */
  | { type: "prompt_only" };

export type Guideline = {
  /** Canonical rule number from the brand doc (1-indexed, display order). */
  id: number;
  /** Verbatim guideline text — rendered into the prompt and the checklist tooltip. */
  text: string;
  /** Short label for the on-card checklist chip. */
  label: string;
  enforcement: Enforcement;
};

export const GUIDELINES: readonly Guideline[] = [
  {
    id: 1,
    text: "Never reference physical appearance in any way",
    label: "Appearance-Free",
    enforcement: { type: "prompt_only" },
  },
  {
    id: 2,
    text: "Every compliment must reference the person's specific job title or function",
    label: "Job-Specific",
    enforcement: {
      type: "evidence",
      field: "job_reference",
      schemaDescription:
        "A VERBATIM quote from the compliment text that references the person's specific job title or function. Copy it word-for-word — an automated check verifies the quote appears exactly in the text.",
    },
  },
  {
    id: 3,
    text: "Every compliment must include at least one wildly absurd metaphor or comparison",
    label: "Absurd Metaphor",
    enforcement: {
      type: "evidence",
      field: "absurd_metaphor",
      schemaDescription:
        "A VERBATIM quote from the compliment text containing the wildly absurd metaphor or comparison. Copy it word-for-word — an automated check verifies the quote appears exactly in the text.",
    },
  },
  {
    id: 4,
    text: "Every compliment must include one made-up statistic",
    label: "Fake Statistic",
    enforcement: {
      type: "evidence",
      field: "fake_statistic",
      schemaDescription:
        "A VERBATIM quote from the compliment text containing the made-up statistic. Copy it word-for-word — an automated check verifies the quote appears exactly in the text.",
    },
  },
  {
    id: 5,
    text: "Maximum 40 words per compliment, no exceptions",
    label: "Under 40 Words",
    enforcement: { type: "word_cap", limit: 40 },
  },
  {
    id: 6,
    text: 'The word "literally" is banned',
    label: 'No "Literally"',
    enforcement: { type: "banned_word", word: "literally" },
  },
  {
    id: 7,
    text: "Never compare the person to a celebrity or any real public figure",
    label: "No Celebrity Comps",
    enforcement: { type: "prompt_only" },
  },
  {
    id: 8,
    text: "All compliments must be workplace appropriate",
    label: "Workplace Safe",
    enforcement: { type: "prompt_only" },
  },
];

/** A guideline whose enforcement is `evidence`, narrowed for the schema/checklist. */
export type EvidenceGuideline = Guideline & {
  enforcement: Extract<Enforcement, { type: "evidence" }>;
};

/** The evidence rules, in canonical order — drives the rules_satisfied schema. */
export const evidenceGuidelines: EvidenceGuideline[] = GUIDELINES.filter(
  (guideline): guideline is EvidenceGuideline =>
    guideline.enforcement.type === "evidence",
);
