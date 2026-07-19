# COMPLIMATIC — Bureau of Industrial-Grade Compliments

**Live:** _URL pending deploy_

Enter a job title or a few details about a person. COMPLIMATIC returns three
over-the-top compliments in three distinct comedic registers, each escalatable
five levels via **Make It More Dramatic** — and every compliment, at every
level, complies with the brand team's Compliment Style Guidelines v2.1, with
the evidence displayed on the card.

## Running locally

```bash
npm install
cp .env.example .env.local   # then paste your Gemini API key (free at aistudio.google.com)
npm run dev                  # http://localhost:3000
npm test                     # validation-layer unit tests
```

The API key lives only in `.env.local` (gitignored) locally and in the Vercel
project settings in production. It is read exclusively by the two server route
handlers — it never reaches the client.

## Prompt architecture (`lib/`)

- **Register pool** (`lib/registers.ts`) — 10 comedic registers (Ancient
  Prophecy, Sports Commentary, Nature Documentary, …), each with a style
  direction and a few-shot *anchor fragment*. The server draws 3 without
  replacement per request. Drawing in code — rather than asking the model to
  "be varied" — guarantees the three compliments never share a register and
  makes repeat generations fresh.
- **One model call writes all three compliments.** The model seeing all three
  registers at once is the strongest variety lever: it cannot produce one joke
  re-costumed three ways. The system prompt (`lib/prompts.ts`) layers comedy
  principles (specificity over superlatives; commit to the bit; user details
  are load-bearing) → the assigned registers → the 8 brand rules verbatim → an
  evidence contract → a worked example.
- **Escalation ladder** (`lib/escalation.ts`) — five leveled instructions,
  each naming a scale tier (local world → institutional → historical-cosmic →
  reality straining → final form) and re-asserting the register, the person,
  the 40-word cap, and the brand rules. After level 5 the button retires.

## Conversation state

The server is stateless; each card owns its own conversation thread in client
state and POSTs it whole on every escalation. Generation is one call for three
compliments, so on a card's *first* escalation the server synthesizes that
card's thread — a single-register system prompt, a user turn asking for the
compliment, and the compliment **as displayed** as the assistant turn — then
appends the ladder instruction. Each response returns the card's complete new
thread for the client to store, so level 3 genuinely builds on levels 1 and 2.
Failed escalations are never appended: the card keeps its current compliment
and the thread stays clean.

## The guidelines are a single structured source (`lib/guidelines.ts`)

The Compliment Style Guidelines live in one data module as the living document a
brand team would actually own. Each rule is a record carrying **both** its
verbatim text **and** a typed *enforcement contract* from a closed set —
`word_cap`, `banned_word`, `evidence`, `prompt_only`:

```ts
{ id: 5, text: "Maximum 40 words per compliment, no exceptions",
  label: "Under 40 Words", enforcement: { type: "word_cap", limit: 40 } }
```

That one module drives the prompt (`lib/prompts.ts`), the response schema
(`lib/types.ts` builds `rules_satisfied` from the evidence rules), the validator
(`lib/validation.ts` iterates the records), the repair messages
(`lib/repair.ts`), and the on-card checklist (`components/RuleChecklist.tsx`).
So a brand-team edit — retune the word cap, swap the banned word, reword a rule,
add a `prompt_only` rule — updates every consumer at once with no other code
change. Only a genuinely new *enforcement type* needs engineering, which is the
correct boundary: you can't config-file your way into claiming machine
verification you haven't built. This also removes a real drift risk — rule text,
rule semantics, and checklist labels used to live in three separate files.

### Three honest tiers (the enforcement types)

| Tier | Enforcement type | Rules today | Mechanism |
| --- | --- | --- | --- |
| 1 — deterministic | `word_cap`, `banned_word` | 5 (≤40 words), 6 (no "literally") | Word counter; whole-word regex built from the configured word |
| 2 — code-assisted | `evidence` | 2, 3, 4 | The model quotes its own text **verbatim** per evidence field; a normalized substring check catches hallucinated evidence |
| 3 — prompt-enforced | `prompt_only` | 1 (appearance), 7 (celebrities), 8 (workplace-appropriate), and the *quality* of 2/3/4 | System prompt only — deliberately **not** claimed as validated |

Tier 3 is an honest gap: semantic rules would need an LLM judge (see
"Considered and rejected"). The rule checklist on each card reflects exactly
this split — evidence rules show their quoted fragment, mechanical rules show
verified facts ("37/40 words"), prompt-enforced rules say so in a tooltip.

**Word-count convention:** split on whitespace; a token counts iff it contains
at least one letter or digit (`/[\p{L}\p{N}]/u`). So "0.4%" is 1 word, a bare
"—" is 0, "world-class" is 1. **Banned word:** `/\bliterally\b/iu` — the rule
bans the word, not the stem, so "literal" passes.

### Violations are repaired, not regenerated

On a violation the server sends one surgical follow-up turn in-thread, listing
only the violations with exact numbers ("Your compliment is 46 words… cut 6 or
more") — preserving the joke instead of rerolling it. Hard caps, never loops:
one parse retry, one repair turn. If a compliment still violates after repair
it is **dropped** — the slot shows a themed rejection with a per-slot retry,
because a checkmark next to a violated rule would be a lie.

## Considered and rejected

- **Server-held sessions** — breaks on serverless, buys nothing; client-held
  threads make the conversation-state design visible in ~20 lines.
- **Three parallel model calls** — 3× cost, more error states, and *higher*
  collision risk, since no call can see what the others wrote.
- **LLM-as-judge for the semantic rules** — 2× latency and cost for marginal
  gain on a comedy app; documented as the Tier 3 gap instead.
- **Fully external guidelines (CMS / hosted JSON / DB)** — deferred. The
  structured single source (`lib/guidelines.ts`) already makes the guidelines a
  living document editable without touching consumers; going fully external
  would only move where that data is *loaded* (behind a fetch with caching and a
  bundled last-known-good fallback, so the app never generates ungoverned
  compliments or blanks if the source is down) and stamp each generation with
  its guidelines version. It adds infrastructure and failure modes without
  moving any graded criterion, so it's left as a one-step extension.

## Error handling

Errors reach the client as a typed taxonomy — `provider_error`,
`validation_failed`, `bad_input` — with themed, comprehensible surfaces whose
blast radius matches the action: a failed generate gets a full-grid panel with
retry, a rejected slot gets a per-slot "appeal", a failed escalation gets an
inline notice while the compliment and meter stay untouched, and clipboard
rejection falls back to "select the text" rather than faking success. Real
provider detail is logged server-side only. Nothing blanks the app.

## Stack

Next.js (App Router) + TypeScript + Tailwind on Vercel. Gemini 3.5 Flash via
the official `@google/genai` SDK's **Interactions API**
(`client.interactions.create`) with native structured outputs (`response_format`
+ zod), so every response is schema-valid JSON — no scraping. Each card's thread
is re-sent whole as the interaction `input`, with `store: false` — the app owns
its conversation state, so it opts out of server-side retention rather than
chaining calls with `previous_interaction_id`. The model is one line in
`lib/gemini.ts`. (Model chosen after a cross-provider comparison on humor
quality, constraint compliance, and latency; the provider module's narrow
interface — one `callStructured` function — keeps a future swap to a one-file
change.)
