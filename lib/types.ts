import { z } from "zod";
import { evidenceGuidelines } from "./guidelines";
import type { RegisterInfo } from "./registers";

/**
 * The rules_satisfied shape is built from the evidence guidelines, so adding,
 * removing, or reworking an evidence rule in `lib/guidelines.ts` reshapes the
 * schema (and its field descriptions) automatically. Each field is a VERBATIM
 * quote the validator confirms appears in the compliment text, catching
 * hallucinated evidence.
 */
const rulesSatisfiedShape: Record<string, z.ZodString> = Object.fromEntries(
  evidenceGuidelines.map(
    (guideline) =>
      [
        guideline.enforcement.field,
        z.string().describe(guideline.enforcement.schemaDescription),
      ] as const,
  ),
);

export const RulesSatisfiedSchema = z.object(rulesSatisfiedShape);

/** Keyed by evidence-guideline field id → the model's verbatim quote. */
export type RulesSatisfied = Record<string, string>;

export type ComplimentOutput = {
  register: string;
  text: string;
  rules_satisfied: RulesSatisfied;
};

export type GenerateOutput = { compliments: ComplimentOutput[] };

// Annotated as ZodType<…our hand-written types…> because the dynamically-built
// rules_satisfied shape doesn't statically infer its keys; the runtime schema
// is a normal ZodObject, so z.toJSONSchema and .parse behave as usual.
export const ComplimentSchema: z.ZodType<ComplimentOutput> = z.object({
  register: z.string().describe("The id of the register this compliment uses."),
  text: z
    .string()
    .describe("The compliment itself. Obey the maximum word count exactly."),
  rules_satisfied: RulesSatisfiedSchema,
});

export const GenerateOutputSchema: z.ZodType<GenerateOutput> = z.object({
  compliments: z
    .array(ComplimentSchema)
    .length(3)
    .describe("Exactly 3 compliments, in the order the registers were listed."),
});

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
