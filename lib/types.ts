import { z } from "zod";
import type { RegisterInfo } from "./registers";

/**
 * The rules_satisfied shape is defined exactly once, here, as a zod schema.
 * Evidence fields are VERBATIM QUOTES — a validator checks each quote appears
 * word-for-word in the compliment text, which catches hallucinated evidence.
 */
export const RulesSatisfiedSchema = z.object({
  job_reference: z
    .string()
    .describe(
      "A VERBATIM quote from the compliment text that references the person's specific job title or function. Copy it word-for-word — an automated check verifies the quote appears exactly in the text.",
    ),
  absurd_metaphor: z
    .string()
    .describe(
      "A VERBATIM quote from the compliment text containing the wildly absurd metaphor or comparison. Copy it word-for-word — an automated check verifies the quote appears exactly in the text.",
    ),
  fake_statistic: z
    .string()
    .describe(
      "A VERBATIM quote from the compliment text containing the made-up statistic. Copy it word-for-word — an automated check verifies the quote appears exactly in the text.",
    ),
});

export const ComplimentSchema = z.object({
  register: z.string().describe("The id of the register this compliment uses."),
  text: z
    .string()
    .describe("The compliment itself. Maximum 40 words, no exceptions."),
  rules_satisfied: RulesSatisfiedSchema,
});

export const GenerateOutputSchema = z.object({
  compliments: z
    .array(ComplimentSchema)
    .length(3)
    .describe("Exactly 3 compliments, in the order the registers were listed."),
});

export type RulesSatisfied = z.infer<typeof RulesSatisfiedSchema>;
export type ComplimentOutput = z.infer<typeof ComplimentSchema>;

/** What a card actually renders: post-repair text + its evidence. */
export type DisplayCompliment = {
  text: string;
  rulesSatisfied: RulesSatisfied;
};

/** A turn in a card's conversation thread (client-held, POSTed on escalate). */
export type Message = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Error taxonomy exposed to the client. Real provider detail is logged
 * server-side only.
 */
export type ApiError =
  | { type: "provider_error"; message: string }
  | { type: "validation_failed"; message: string }
  | { type: "bad_input"; message: string };

// ---- Wire types ----

export type GenerateRequest = {
  details: string;
  /** When set, regenerate a single compliment in this register (per-slot retry). */
  registerId?: string;
};

/** One of the three result slots; `rejected` means both the original and its
 * repair violated the brand rules — strictness is the product, so the slot
 * fails honestly instead of showing a lying checkmark. */
export type Slot =
  | { status: "ok"; register: RegisterInfo; compliment: DisplayCompliment }
  | { status: "rejected"; register: RegisterInfo };

export type GenerateResponse = { slots: Slot[] };

export type EscalateRequest = {
  details: string;
  registerId: string;
  /** Escalations performed so far (0 → this request performs level 1). */
  level: number;
  /** The card's thread. Empty on first escalation — the server synthesizes it. */
  thread: Message[];
  /** The compliment currently displayed (used to synthesize the base thread). */
  currentText: string;
};

export type EscalateResponse = {
  compliment: DisplayCompliment;
  /** The card's complete new thread (post-repair). Client stores it verbatim. */
  thread: Message[];
};

export type ErrorResponse = { error: ApiError };
