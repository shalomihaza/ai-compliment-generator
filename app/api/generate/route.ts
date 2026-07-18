import { ProviderError, callStructuredWithRetry } from "@/lib/anthropic";
import {
  batchSystemPrompt,
  generateUserTurn,
  singleRegisterSystemPrompt,
  singleUserTurn,
} from "@/lib/prompts";
import { drawRegisters, getRegister, type RegisterInfo } from "@/lib/registers";
import {
  buildBatchRepairMessage,
  generateCleanCompliment,
} from "@/lib/repair";
import {
  GenerateOutputSchema,
  type ComplimentOutput,
  type ErrorResponse,
  type GenerateRequest,
  type GenerateResponse,
  type Slot,
} from "@/lib/types";
import { validateCompliment, type Violation } from "@/lib/validation";

export const maxDuration = 60;

const MAX_DETAILS_LENGTH = 300;

export async function POST(request: Request): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return badInput("That request didn't make sense. Refresh and try again.");
  }

  const details = typeof body.details === "string" ? body.details.trim() : "";
  if (!details) {
    return badInput("Tell us something about the person first.");
  }
  if (details.length > MAX_DETAILS_LENGTH) {
    return badInput(
      `Keep it under ${MAX_DETAILS_LENGTH} characters — the compliment does the elaborating.`,
    );
  }

  try {
    const slots = body.registerId
      ? await regenerateSlot(details, body.registerId)
      : await generateTrio(details);
    if (slots instanceof Response) return slots;
    return Response.json({ slots } satisfies GenerateResponse);
  } catch (error) {
    if (error instanceof ProviderError) {
      return Response.json({ error: error.apiError } satisfies ErrorResponse, {
        status: 502,
      });
    }
    throw error;
  }
}

/** Batch mode: one model call writes all three compliments — the model seeing
 * all three at once is the strongest variety lever. */
async function generateTrio(details: string): Promise<Slot[]> {
  const registers = drawRegisters(3);
  const system = batchSystemPrompt(registers);
  const messages = [
    { role: "user" as const, content: generateUserTurn(details) },
  ];

  const first = await callStructuredWithRetry({
    system,
    messages,
    schema: GenerateOutputSchema,
  });

  const compliments = first.parsed.compliments;
  const violationsBySlot = new Map<number, Violation[]>();
  compliments.forEach((compliment, i) => {
    const violations = validateCompliment(compliment);
    if (violations.length > 0) violationsBySlot.set(i, violations);
  });

  if (violationsBySlot.size === 0) {
    return compliments.map((c, i) => okSlot(registers[i], c));
  }

  // ONE batch repair turn covering every violating compliment. Clean slots
  // keep their original text regardless of what the repair returns.
  const repaired = await callStructuredWithRetry({
    system,
    messages: [
      ...messages,
      { role: "assistant" as const, content: first.rawText },
      {
        role: "user" as const,
        content: buildBatchRepairMessage(violationsBySlot),
      },
    ],
    schema: GenerateOutputSchema,
  });

  return compliments.map((original, i) => {
    if (!violationsBySlot.has(i)) return okSlot(registers[i], original);
    const fixed = repaired.parsed.compliments[i];
    if (validateCompliment(fixed).length === 0) {
      return okSlot(registers[i], fixed);
    }
    // Drop, don't lie: the slot fails honestly rather than showing a
    // checkmark next to a violated rule.
    console.error("slot rejected after repair", registers[i].id);
    return { status: "rejected", register: registers[i] } satisfies Slot;
  });
}

/** Per-slot retry: regenerate ONE compliment in a fixed register. */
async function regenerateSlot(
  details: string,
  registerId: string,
): Promise<Slot[] | Response> {
  const register = getRegister(registerId);
  if (!register) {
    return badInput("Unknown register. Refresh and try again.");
  }

  const result = await generateCleanCompliment({
    system: singleRegisterSystemPrompt(register),
    messages: [
      { role: "user", content: singleUserTurn(details, register) },
    ],
  });

  return [
    result.ok
      ? okSlot(register, result.compliment)
      : ({ status: "rejected", register } satisfies Slot),
  ];
}

function okSlot(register: RegisterInfo, compliment: ComplimentOutput): Slot {
  return {
    status: "ok",
    register,
    compliment: {
      text: compliment.text,
      rulesSatisfied: compliment.rules_satisfied,
    },
  };
}

function badInput(message: string): Response {
  return Response.json(
    { error: { type: "bad_input", message } } satisfies ErrorResponse,
    { status: 400 },
  );
}
