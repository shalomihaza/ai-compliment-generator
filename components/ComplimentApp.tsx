"use client";

import { useReducer } from "react";
import { ComplimentForm } from "./ComplimentForm";
import { ComplimentGrid } from "./ComplimentGrid";
import { EmptyState } from "./EmptyState";
import { LoadingTheater } from "./LoadingTheater";
import { Toast } from "./Toast";
import { useToast } from "@/hooks/useToast";
import type { RegisterInfo } from "@/lib/registers";
import type {
  ApiError,
  DisplayCompliment,
  EscalateResponse,
  GenerateResponse,
  Message,
  Slot,
} from "@/lib/types";

/**
 * All app state lives in this one reducer. App phase and per-card status are
 * separate machines: card 1 mid-escalation must not block copy or escalate on
 * cards 2/3.
 */

export type CardData =
  | {
      slot: number;
      register: RegisterInfo;
      status: "rejected";
      retrying: boolean;
    }
  | {
      slot: number;
      register: RegisterInfo;
      status: "ready" | "escalating" | "escalate_failed";
      thread: Message[];
      current: DisplayCompliment;
      level: number;
      escalateError?: string;
    };

export type AppState =
  | { phase: "idle" }
  | { phase: "generating"; details: string }
  | { phase: "ready"; details: string; cards: CardData[] }
  | { phase: "generate_failed"; details: string; error: ApiError };

type Action =
  | { type: "GENERATE_START"; details: string }
  | { type: "GENERATE_SUCCESS"; slots: Slot[] }
  | { type: "GENERATE_FAILED"; error: ApiError }
  | { type: "ESCALATE_START"; slot: number }
  | {
      type: "ESCALATE_SUCCESS";
      slot: number;
      compliment: DisplayCompliment;
      thread: Message[];
    }
  | { type: "ESCALATE_FAILED"; slot: number; message: string }
  | { type: "RETRY_SLOT_START"; slot: number }
  | { type: "RETRY_SLOT_RESULT"; slot: number; result: Slot }
  | { type: "RETRY_SLOT_FAILED"; slot: number }
  | { type: "RESET" };

function cardFromSlot(slot: Slot, index: number): CardData {
  if (slot.status === "rejected") {
    return {
      slot: index,
      register: slot.register,
      status: "rejected",
      retrying: false,
    };
  }
  return {
    slot: index,
    register: slot.register,
    status: "ready",
    thread: [],
    current: slot.compliment,
    level: 0,
  };
}

function updateCard(
  state: AppState,
  slot: number,
  update: (card: CardData) => CardData,
): AppState {
  if (state.phase !== "ready") return state;
  return {
    ...state,
    cards: state.cards.map((card) => (card.slot === slot ? update(card) : card)),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "GENERATE_START":
      return { phase: "generating", details: action.details };
    case "GENERATE_SUCCESS":
      if (state.phase !== "generating") return state;
      return {
        phase: "ready",
        details: state.details,
        cards: action.slots.map(cardFromSlot),
      };
    case "GENERATE_FAILED":
      if (state.phase !== "generating") return state;
      return {
        phase: "generate_failed",
        details: state.details,
        error: action.error,
      };
    case "ESCALATE_START":
      return updateCard(state, action.slot, (card) =>
        card.status === "rejected"
          ? card
          : { ...card, status: "escalating", escalateError: undefined },
      );
    case "ESCALATE_SUCCESS":
      return updateCard(state, action.slot, (card) =>
        card.status === "rejected"
          ? card
          : {
              ...card,
              status: "ready",
              current: action.compliment,
              thread: action.thread,
              level: card.level + 1,
            },
      );
    case "ESCALATE_FAILED":
      // Compliment and meter stay untouched; the failed turn was never
      // appended server-side either.
      return updateCard(state, action.slot, (card) =>
        card.status === "rejected"
          ? card
          : { ...card, status: "escalate_failed", escalateError: action.message },
      );
    case "RETRY_SLOT_START":
      return updateCard(state, action.slot, (card) =>
        card.status === "rejected" ? { ...card, retrying: true } : card,
      );
    case "RETRY_SLOT_RESULT":
      return updateCard(state, action.slot, () =>
        cardFromSlot(action.result, action.slot),
      );
    case "RETRY_SLOT_FAILED":
      return updateCard(state, action.slot, (card) =>
        card.status === "rejected" ? { ...card, retrying: false } : card,
      );
    case "RESET":
      return { phase: "idle" };
  }
}

/** POST JSON; on non-2xx throw the server's ApiError (or a generic one). */
async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw {
      type: "provider_error",
      message: "Couldn't reach the Compliment Engine. Check your connection.",
    } satisfies ApiError;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error: ApiError = payload?.error ?? {
      type: "provider_error",
      message: "The Compliment Engine is overwhelmed by emotion. Try again.",
    };
    throw error;
  }
  return payload as T;
}

function asApiError(error: unknown): ApiError {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "message" in error
  ) {
    return error as ApiError;
  }
  return {
    type: "provider_error",
    message: "The Compliment Engine is overwhelmed by emotion. Try again.",
  };
}

export function ComplimentApp() {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });
  const { toast, showToast } = useToast();

  async function generate(details: string) {
    dispatch({ type: "GENERATE_START", details });
    try {
      const data = await postJson<GenerateResponse>("/api/generate", {
        details,
      });
      dispatch({ type: "GENERATE_SUCCESS", slots: data.slots });
    } catch (error) {
      dispatch({ type: "GENERATE_FAILED", error: asApiError(error) });
    }
  }

  async function escalate(card: CardData) {
    if (state.phase !== "ready" || card.status === "rejected") return;
    dispatch({ type: "ESCALATE_START", slot: card.slot });
    try {
      const data = await postJson<EscalateResponse>("/api/escalate", {
        details: state.details,
        registerId: card.register.id,
        level: card.level,
        thread: card.thread,
        currentText: card.current.text,
      });
      dispatch({
        type: "ESCALATE_SUCCESS",
        slot: card.slot,
        compliment: data.compliment,
        thread: data.thread,
      });
    } catch (error) {
      dispatch({
        type: "ESCALATE_FAILED",
        slot: card.slot,
        message: asApiError(error).message,
      });
    }
  }

  async function retrySlot(card: CardData) {
    if (state.phase !== "ready") return;
    dispatch({ type: "RETRY_SLOT_START", slot: card.slot });
    try {
      const data = await postJson<GenerateResponse>("/api/generate", {
        details: state.details,
        registerId: card.register.id,
      });
      dispatch({
        type: "RETRY_SLOT_RESULT",
        slot: card.slot,
        result: data.slots[0],
      });
    } catch {
      dispatch({ type: "RETRY_SLOT_FAILED", slot: card.slot });
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-16">
      <ComplimentForm
        busy={state.phase === "generating"}
        onSubmit={generate}
        onReset={
          state.phase === "ready" || state.phase === "generate_failed"
            ? () => dispatch({ type: "RESET" })
            : undefined
        }
      />

      {state.phase === "idle" && <EmptyState />}

      {state.phase === "generating" && <LoadingTheater />}

      {state.phase === "ready" && (
        <ComplimentGrid
          cards={state.cards}
          onEscalate={escalate}
          onRetrySlot={retrySlot}
          onToast={showToast}
        />
      )}

      {state.phase === "generate_failed" && (
        <div className="mt-12 max-w-lg mx-auto bg-white/80 backdrop-blur-xl ring-1 ring-line rounded-2xl p-8 text-center shadow-lg shadow-coral/5">
          <p aria-hidden className="text-4xl mb-4">
            🎭
          </p>
          <p className="font-display text-xl text-text-strong mb-2 text-balance">
            The compliment engine got stage fright. Give it another chance.
          </p>
          <p className="text-sm text-text-soft mb-6">{state.error.message}</p>
          <button
            type="button"
            onClick={() => generate(state.details)}
            className="grad-primary text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-coral/25 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition"
          >
            Try again
          </button>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
