# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run lint       # eslint
npm test           # vitest run (validation-layer unit tests)
npx vitest run lib/validation.test.ts          # run one test file
npx vitest run -t "word count"                 # run tests matching a name
```

Requires `GEMINI_API_KEY` in `.env.local` (see `.env.example`; free key at aistudio.google.com). The key is read only by the two server route handlers via the SDK — it never reaches the client.

## What this is

LAUDATRON generates three over-the-top compliments in three distinct comedic *registers* from a job title / person details, each escalatable through 5 drama levels. The product thesis is **honest strictness**: every compliment must comply with 8 brand "Compliment Style Guidelines," and the UI only shows a checkmark for rules the code can actually verify.

## Architecture

Next.js App Router + TypeScript + Tailwind. Two server routes call Gemini; all conversation state lives in the client.

**Provider seam — `lib/gemini.ts`.** Every model call goes through `callStructured` / `callStructuredWithRetry`. The model id is one line (`gemini-3.5-flash`). Uses the `@google/genai` **Interactions API** (`client.interactions.create`) with native structured outputs (`response_format: { type: "text", mime_type: "application/json", schema: z.toJSONSchema(...) }`) so responses are schema-valid JSON — no scraping. Reads the parsed JSON from `interaction.output_text`. The client-held card thread is passed as the interaction `input` in the steps-based format (`step_list` — an array of `user_input` / `model_output` steps, each with `content: [{ type: "text", text }]`) with `store: false` — the app is stateless and re-sends the whole thread, so it does **not** use `previous_interaction_id`. Finish signal is `interaction.status` (not a per-candidate `finishReason`): `"incomplete"` → truncation, any other non-`"completed"` status or a `model_output` step `error` → decline. Throws a typed taxonomy: `ProviderError` (unrepairable, carries a themed client message) and `ParseFailure` (retried once). Swapping providers is meant to stay a one-file change.

**Variety is enforced in code, not by prompting.** `lib/registers.ts` holds 10 registers; the server `drawRegisters` picks 3 without replacement per request. **One** model call writes all three at once (seeing all three registers is the strongest anti-collision lever). Do not refactor this into three parallel calls — that raises cost *and* collision risk (see README "Considered and rejected").

**Prompt layering — `lib/prompts.ts`.** Batch and single-register variants. System prompt layers: comedy principles → assigned register(s) → the 8 brand rules verbatim → an evidence contract → a worked example.

**Escalation — `lib/escalation.ts`, `app/api/escalate/route.ts`.** The server is stateless; each card owns its conversation `thread` (client-held, POSTed whole on every escalate). Because generation is one call for three, on a card's *first* escalation the server **synthesizes** that card's thread (single-register system prompt + user turn + the displayed compliment as the assistant turn), then appends the ladder instruction. The response returns the card's complete new thread for the client to store. Failed escalations are never appended.

**Validation — `lib/validation.ts` (three honest tiers):**
- Tier 1 deterministic: rule 5 word count (`countWords`), rule 6 banned word `literally` (`hasBannedWord`), zod shape.
- Tier 2 code-assisted: the model returns `rules_satisfied` as **verbatim quotes** (`RulesSatisfiedSchema` in `lib/types.ts`); a normalized substring check confirms each quote appears in the compliment, catching hallucinated evidence.
- Tier 3 prompt-enforced only: rules 1/7/8 and the *quality* of 2/3/4 — deliberately **not** claimed as validated. UI note (deliberate product call, 2026-07): all rule badges render with a uniform green ✓ for visual consistency; the tier split survives in badge tooltips ("Requested in the prompt — not machine-verified" for Tier 3) and in the always-visible verbatim evidence rows for rules 2/3/4. Don't reintroduce a visual tier split, and don't remove the tooltip honesty either.

Word-count convention: split on whitespace, a token counts iff it contains a letter or digit (`/[\p{L}\p{N}]/u`). Banned word is `/\bliterally\b/iu` (the word, not the stem).

**Repair, not regenerate — `lib/repair.ts`.** On a violation the server sends one surgical in-thread follow-up listing only the violations with exact numbers, preserving the joke. Hard caps, never loops: one parse retry, one repair turn. If it still violates, the slot is **dropped** and rendered as a themed `rejected` `Slot` with a per-slot retry — never a lying checkmark.

## Conventions

- **Wire types live in `lib/types.ts`** as zod schemas / TS types (`GenerateRequest/Response`, `EscalateRequest/Response`, `Slot`, `ApiError`). Keep request/response shapes in sync there.
- **Errors are a typed taxonomy** (`provider_error` | `validation_failed` | `bad_input`) with themed client-facing copy; real provider detail is logged server-side only. Match that pattern for new failure modes, and size the client surface to the blast radius (full-grid vs per-slot vs inline).
- Routes cap inputs (`MAX_DETAILS_LENGTH`, `MAX_THREAD_MESSAGES`, `MAX_MESSAGE_LENGTH`) and set `maxDuration = 60`.
- Client UI is in `components/` (`ComplimentApp.tsx` orchestrates; cards hold their own thread state).
