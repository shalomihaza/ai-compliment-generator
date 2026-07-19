import { ApiError as GenAiApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { ApiError, Message } from "./types";

/**
 * Single provider entry point (Gemini 3.5 Flash). The model is a one-line
 * change; every call in the app goes through callStructured().
 */

const MODEL = "gemini-3.5-flash";
const MAX_OUTPUT_TOKENS = 8192; // headroom: model thinking tokens count toward this cap

const client = new GoogleGenAI({}); // reads GEMINI_API_KEY

/** Thrown when the provider fails in any way the caller can't repair. */
export class ProviderError extends Error {
  readonly apiError: ApiError;

  constructor(message: string) {
    super(message);
    this.apiError = { type: "provider_error", message };
  }
}

/** Structured output failed to parse — retryable once per the retry policy. */
export class ParseFailure extends Error {
  constructor() {
    super("structured output failed to parse");
  }
}

type StructuredCall<T> = {
  system: string;
  messages: Message[];
  schema: z.ZodType<T>;
};

/**
 * The card's thread becomes the interaction's `input`: an array of turns the
 * client re-sends whole on every request. The app is deliberately stateless, so
 * we opt out of server storage (`store: false`) rather than threading calls with
 * `previous_interaction_id`.
 */
function toTurns(messages: Message[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    content: message.content,
  }));
}

/**
 * One structured-output Interactions call: `response_format` constrains the
 * response to our schema at the API level; zod re-parses server-side (Tier 1).
 * Returns the parsed value plus the raw response text (needed to build repair
 * turns in-thread).
 */
export async function callStructured<T>({
  system,
  messages,
  schema,
}: StructuredCall<T>): Promise<{ parsed: T; rawText: string }> {
  // The SDK reads the key lazily — guard explicitly so a missing env var
  // reads as what it is.
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    throw new ProviderError(
      "The Compliment Engine is misconfigured (missing credentials). This one is on us.",
    );
  }

  const interaction = await client.interactions
    .create({
      model: MODEL,
      store: false,
      system_instruction: system,
      generation_config: { max_output_tokens: MAX_OUTPUT_TOKENS },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: z.toJSONSchema(schema),
      },
      input: toTurns(messages),
    })
    .catch((error: unknown) => {
      throw toProviderError(error);
    });

  // Interaction-level status is the finish signal (no per-candidate finishReason
  // in the Interactions API). "incomplete" == truncated mid-response; any other
  // non-"completed" status, or an error on the model_output step, is a decline
  // (safety/prohibited content included).
  if (interaction.status === "incomplete") {
    throw new ProviderError(
      "The Compliment Engine ran out of breath mid-sentence. Try again.",
    );
  }
  const modelErrored = interaction.steps.some(
    (step) => step.type === "model_output" && step.error,
  );
  if (interaction.status !== "completed" || modelErrored) {
    throw new ProviderError(
      "The Compliment Engine respectfully declined this request. Try different details.",
    );
  }

  const rawText = interaction.output_text ?? "";
  let parsed: T;
  try {
    parsed = schema.parse(JSON.parse(rawText));
  } catch (error) {
    // Malformed or schema-violating JSON — caller retries once.
    console.error("structured output failed to parse", error);
    throw new ParseFailure();
  }

  return { parsed, rawText };
}

/** Retry policy for parse failures: one full retry, then provider_error. */
export async function callStructuredWithRetry<T>(
  call: StructuredCall<T>,
): Promise<{ parsed: T; rawText: string }> {
  try {
    return await callStructured(call);
  } catch (error) {
    if (!(error instanceof ParseFailure)) throw error;
    try {
      return await callStructured(call);
    } catch (retryError) {
      if (!(retryError instanceof ParseFailure)) throw retryError;
      console.error("structured output unparseable after retry");
      throw new ProviderError(
        "The Compliment Engine produced something unspeakable twice in a row. Try again.",
      );
    }
  }
}

function toProviderError(error: unknown): ProviderError {
  // Log the real detail server-side; the client gets the themed taxonomy.
  console.error("gemini call failed", error);

  if (error instanceof GenAiApiError) {
    if (error.status === 429) {
      return new ProviderError(
        "The Compliment Engine is overwhelmed by demand. Give it a moment and try again.",
      );
    }
    if (error.status === 401 || error.status === 403) {
      return new ProviderError(
        "The Compliment Engine is misconfigured (bad credentials). This one is on us.",
      );
    }
    return new ProviderError(
      "The Compliment Engine is overwhelmed by emotion. Try again.",
    );
  }
  // Non-API failure (network, DNS) — fetch rejects before a response exists.
  return new ProviderError(
    "Couldn't reach the Compliment Engine. Check your connection and try again.",
  );
}
