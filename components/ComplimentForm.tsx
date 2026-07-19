"use client";

import { useRef, useState } from "react";
import { useRotatingPlaceholder } from "@/hooks/useRotatingPlaceholder";

const MAX_LENGTH = 300;

// Name + job + one telling detail — the input format that gets the best
// compliments, doubling as both rotating placeholders and suggestion chips.
const PERSON_EXAMPLES = [
  "Sarah, accountant, loves hiking",
  "my coworker Dev, barista, latte-art perfectionist",
  "Maya, nurse, never loses her cool",
  "Leo, product manager",
  "Ms. Rivera, teacher",
  "Sam, software engineer, refuses to write bugs",
];

export function ComplimentForm({
  busy,
  onSubmit,
  onReset,
}: {
  busy: boolean;
  onSubmit: (details: string) => void;
  onReset?: () => void;
}) {
  const [details, setDetails] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = useRotatingPlaceholder(PERSON_EXAMPLES);

  const trimmed = details.trim();
  const empty = trimmed.length === 0;
  const tooLong = trimmed.length > MAX_LENGTH;
  const showError = touched && (empty || tooLong);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (empty || tooLong || busy) return;
    onSubmit(trimmed);
  }

  function pickChip(chip: string) {
    setDetails(chip);
    setTouched(false);
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-2 bg-white/70 backdrop-blur-xl ring-1 ring-line rounded-2xl p-2 shadow-lg shadow-coral/5 focus-within:ring-2 focus-within:ring-coral/40 focus-within:shadow-xl focus-within:shadow-coral/15 transition-shadow duration-300">
        <input
          id="details"
          ref={inputRef}
          type="text"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={`e.g. ${placeholder}`}
          aria-label="Who are we hyping up today?"
          disabled={busy}
          maxLength={MAX_LENGTH + 50}
          className="flex-1 bg-transparent px-4 py-3 text-text-strong placeholder:text-text-faint focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy}
          className="grad-primary text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-coral/25 hover:shadow-lg hover:shadow-coral/30 hover:-translate-y-0.5 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {busy ? "Inflating… 🎈" : "Inflate Their Ego 🚀"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {PERSON_EXAMPLES.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={busy}
            onClick={() => pickChip(chip)}
            className="bg-surface-soft ring-1 ring-line rounded-full px-3.5 py-1.5 text-sm text-text-soft hover:ring-coral/50 hover:text-text-strong active:scale-95 transition disabled:opacity-60"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-between text-xs text-text-faint min-h-5">
        <span className="text-danger">
          {showError &&
            (empty
              ? "Tell us something about the person first."
              : `Keep it under ${MAX_LENGTH} characters — the compliment does the elaborating.`)}
        </span>
        <span className="flex gap-4">
          {details.length > MAX_LENGTH - 60 && (
            <span className={tooLong ? "text-danger" : ""}>
              {trimmed.length}/{MAX_LENGTH}
            </span>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="underline underline-offset-2 hover:text-text-strong transition-colors"
            >
              Start over
            </button>
          )}
        </span>
      </div>
    </form>
  );
}
