"use client";

import { useState } from "react";

const MAX_LENGTH = 300;

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

  return (
    <form onSubmit={submit} className="w-full max-w-2xl mx-auto">
      <label
        htmlFor="details"
        className="block text-sm uppercase tracking-widest text-gold mb-3"
      >
        Who are we hyping up today?
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="details"
          type="text"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. Sarah, accountant, loves hiking"
          disabled={busy}
          maxLength={MAX_LENGTH + 50}
          className="flex-1 bg-ink-soft border border-ink-line rounded-sm px-4 py-3 text-paper placeholder:text-paper/35 focus:outline-none focus:border-gold disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-gold text-ink font-semibold uppercase tracking-widest text-sm px-6 py-3 rounded-sm hover:bg-ember hover:text-paper transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      </div>
      <div className="mt-2 flex justify-between text-xs text-paper/50 min-h-5">
        <span className="text-ember">
          {showError &&
            (empty
              ? "Tell us something about the person first."
              : `Keep it under ${MAX_LENGTH} characters — the compliment does the elaborating.`)}
        </span>
        <span className="flex gap-4">
          {details.length > MAX_LENGTH - 60 && (
            <span className={tooLong ? "text-ember" : ""}>
              {trimmed.length}/{MAX_LENGTH}
            </span>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="underline underline-offset-2 hover:text-paper"
            >
              Start over
            </button>
          )}
        </span>
      </div>
    </form>
  );
}
