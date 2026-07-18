import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { ApiError, Message } from "./types";

/**
 * Single provider entry point. The model is a one-line change; every call in
 * the app goes through callStructured().
 */

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 2048;

const client = new Anthropic();

/** Thrown when the provider fails in any way the caller can't repair. */
export class ProviderError extends Error {
  readonly apiError: ApiError;

  constructor(message: string) {
    super(message);
    this.apiError = { type: "provider_error", message };
  }
}

type StructuredCall<T> = {
  system: string;
  messages: Message[];
  schema: z.ZodType<T>;
};

/**
 * One structured-output call: native `output_config.format` guarantees
 * schema-valid JSON at the API level; zod re-parses client-side (Tier 1).
 * Returns the parsed value plus the raw assistant text (needed to build
 * repair turns in-thread).
 */
export async function callStructured<T>({
  system,
  messages,
  schema,
}: StructuredCall<T>): Promise<{ parsed: T; rawText: string }> {
  // The SDK throws an untyped Error when no credentials resolve — guard
  // explicitly so a missing env var reads as what it is.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new ProviderError(
      "The Compliment Engine is misconfigured (missing credentials). This one is on us.",
    );
  }

  const response = await client.messages
    .parse({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
      output_config: { format: zodOutputFormat(schema) },
    })
    .catch((error: unknown) => {
      // SDK failures (transport, API, missing credentials) map to the client
      // taxonomy; anything else (schema mismatch, JSON parse) is a retryable
      // parse failure.
      if (error instanceof Anthropic.AnthropicError) throw toProviderError(error);
      console.error("structured output failed to parse", error);
      throw new ParseFailure();
    });

  if (response.stop_reason === "refusal") {
    throw new ProviderError(
      "The Compliment Engine respectfully declined this request. Try different details.",
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new ProviderError(
      "The Compliment Engine ran out of breath mid-sentence. Try again.",
    );
  }
  if (response.parsed_output == null) {
    // Structured output came back unparseable — caller retries once.
    throw new ParseFailure();
  }

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return { parsed: response.parsed_output, rawText };
}

/** Structured output failed to parse — retryable once per the retry policy. */
export class ParseFailure extends Error {
  constructor() {
    super("structured output failed to parse");
  }
}

/**
 * Retry policy for parse failures: one full retry, then provider_error.
 * (Zod client-side validation failures — e.g. wrong array length — surface as
 * thrown errors from parse(); they get the same single retry.)
 */
export async function callStructuredWithRetry<T>(
  call: StructuredCall<T>,
): Promise<{ parsed: T; rawText: string }> {
  try {
    return await callStructured(call);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    // ParseFailure or zod validation error: one full retry.
    try {
      return await callStructured(call);
    } catch (retryError) {
      if (retryError instanceof ProviderError) throw retryError;
      console.error("structured output unparseable after retry", retryError);
      throw new ProviderError(
        "The Compliment Engine produced something unspeakable twice in a row. Try again.",
      );
    }
  }
}

function toProviderError(error: unknown): ProviderError {
  // Log the real detail server-side; the client gets the themed taxonomy.
  console.error("anthropic call failed", error);

  if (error instanceof Anthropic.RateLimitError) {
    return new ProviderError(
      "The Compliment Engine is overwhelmed by demand. Give it a moment and try again.",
    );
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return new ProviderError(
      "The Compliment Engine is misconfigured (bad credentials). This one is on us.",
    );
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new ProviderError(
      "Couldn't reach the Compliment Engine. Check your connection and try again.",
    );
  }
  if (!(error instanceof Anthropic.APIError)) {
    // Client-side SDK error, e.g. missing/empty ANTHROPIC_API_KEY.
    return new ProviderError(
      "The Compliment Engine is misconfigured (missing credentials). This one is on us.",
    );
  }
  return new ProviderError(
    "The Compliment Engine is overwhelmed by emotion. Try again.",
  );
}
