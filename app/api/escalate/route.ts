import { ProviderError } from "@/lib/anthropic";
import { MAX_LEVEL, ladderInstruction } from "@/lib/escalation";
import { singleRegisterSystemPrompt, singleUserTurn } from "@/lib/prompts";
import { getRegister } from "@/lib/registers";
import { generateCleanCompliment } from "@/lib/repair";
import type {
  ErrorResponse,
  EscalateRequest,
  EscalateResponse,
  Message,
} from "@/lib/types";

export const maxDuration = 60;

const MAX_THREAD_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(request: Request): Promise<Response> {
  let body: EscalateRequest;
  try {
    body = await request.json();
  } catch {
    return badInput("That request didn't make sense. Refresh and try again.");
  }

  const register = getRegister(body.registerId ?? "");
  const details = typeof body.details === "string" ? body.details.trim() : "";
  const currentText =
    typeof body.currentText === "string" ? body.currentText.trim() : "";
  const nextLevel = Number(body.level) + 1;

  if (!register || !details || !currentText) {
    return badInput("Missing card context. Refresh and try again.");
  }
  if (!Number.isInteger(nextLevel) || nextLevel < 1 || nextLevel > MAX_LEVEL) {
    return badInput("MAXIMUM DRAMA already achieved for this compliment.");
  }
  if (!isValidThread(body.thread)) {
    return badInput("Corrupted conversation history. Refresh and try again.");
  }

  // First escalation: synthesize the card's base thread (§3.4) from the
  // compliment AS DISPLAYED (post-repair text).
  const baseThread: Message[] =
    body.thread.length > 0
      ? body.thread
      : [
          { role: "user", content: singleUserTurn(details, register) },
          { role: "assistant", content: currentText },
        ];

  const ladderTurn: Message = {
    role: "user",
    content: ladderInstruction(nextLevel),
  };

  try {
    const result = await generateCleanCompliment({
      system: singleRegisterSystemPrompt(register),
      messages: [...baseThread, ladderTurn],
    });

    if (!result.ok) {
      // Card keeps its current compliment; the failed turn is never appended.
      return Response.json(
        {
          error: {
            type: "validation_failed",
            message:
              "The escalation was rejected by the Brand Compliance Bureau. The current compliment stands.",
          },
        } satisfies ErrorResponse,
        { status: 422 },
      );
    }

    // Repair sub-turns are not persisted — the thread records post-repair
    // text only, so every future escalation builds on what the user saw.
    const thread: Message[] = [
      ...baseThread,
      ladderTurn,
      { role: "assistant", content: result.compliment.text },
    ];

    return Response.json({
      compliment: {
        text: result.compliment.text,
        rulesSatisfied: result.compliment.rules_satisfied,
      },
      thread,
    } satisfies EscalateResponse);
  } catch (error) {
    if (error instanceof ProviderError) {
      return Response.json({ error: error.apiError } satisfies ErrorResponse, {
        status: 502,
      });
    }
    throw error;
  }
}

function isValidThread(thread: unknown): thread is Message[] {
  return (
    Array.isArray(thread) &&
    thread.length <= MAX_THREAD_MESSAGES &&
    thread.every(
      (message) =>
        message &&
        typeof message === "object" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.length <= MAX_MESSAGE_LENGTH,
    )
  );
}

function badInput(message: string): Response {
  return Response.json(
    { error: { type: "bad_input", message } } satisfies ErrorResponse,
    { status: 400 },
  );
}
