# AI Integration Plan — DevStash Pro

> Four Pro-only AI features built on OpenAI `gpt-5-nano`: **auto-tagging**, **summaries**, **Explain This Code**, and **prompt optimizer**.
> Generated from codebase and web research on 2026-10-12. Source prompt: `context/research/ai-integration-research.md`.

---

## 1. Summary

| Decision | Recommendation |
|---|---|
| SDK | Official `openai` Node SDK (v7.x, currently `7.32.0`), using the **Responses API** |
| Model | `gpt-5-nano` (pinned via an `OPENAI_MODEL` env var so it can be swapped without a deploy) |
| Tags, summary, prompt optimizer | **Server Actions**, non-streaming, **Structured Outputs** (`responses.parse` + `zodTextFormat`) |
| Explain This Code | **Route Handler** (`/api/ai/explain`), **streaming** plain text |
| Gating | Existing `canUseProFeature(userId, "AI features")`, checked on the server for every call |
| Rate limiting | New per-user Upstash limiters in `src/lib/rate-limit.ts` (burst + daily) |
| UX | AI output is always a **suggestion**: the user must accept it, and nothing is written to the DB without that |
| Cost | About $0.0002–$0.0006 per call, so even a heavy user costs well under $1/month against $8 revenue |

---

## 2. Current State

### 2.1 What already exists

| Piece | Where | Notes |
|---|---|---|
| `OPENAI_API_KEY` | `.env`, `.env.example`, `.env._production` | Already provisioned. The `openai` package is **not** installed yet. |
| Pro check | `src/lib/usage-limits.ts` → `canUseProFeature(userId, feature)` | Returns `GateResult` (`{ allowed: true } \| { allowed: false; error }`). Reads `isPro` from the DB on every call. It does not depend on `BILLING_ENFORCED`, so Pro features are always gated. |
| Action wrapper | `src/lib/action-result.ts` → `runAction(name, body)` + `ActionResult<T>` | Catches unexpected throws, returns `GENERIC_ACTION_ERROR`, and rethrows Next control-flow errors |
| Rate limiting | `src/lib/rate-limit.ts` → `createLimiter`, `checkRateLimit` | Upstash sliding window that **fails open** if Redis is missing or erroring |
| Route Handler pattern | `src/app/api/upload/route.ts` | auth → `canUseProFeature` → `checkRateLimit` keyed by user ID → Zod parse → work. `/api/*` is **not** covered by `src/proxy.ts`, so each handler does its own `auth()`. |
| Validation | `src/lib/validations/items.ts` | `CONTENT_MAX = 100_000`, `DESCRIPTION_MAX = 2000`, `TAG_MAX = 40`, `TAGS_MAX = 20`; `tagsSchema` lowercases and de-dupes |
| Plan copy | `src/lib/plans.ts` | `PRO_FEATURES` already lists "AI tagging, summaries & explanations"; `FREE_FEATURES` lists "AI features" as excluded |
| `isPro` in the UI | `currentUser.isPro`, passed down as a prop (e.g. `NewItemDialog`, `TopBar`, `AppSidebar`) | The item drawer (`ItemDrawer.tsx`) does **not** receive `isPro` yet |
| Toasts / markdown | `sonner`, `react-markdown` | Both installed |
| Spec | `context/project-overview.md` §AI Features | Lists auto-tag, summaries, Explain This Code, prompt optimizer as Pro-only |

### 2.2 Relevant data model

`Item` has `title`, `description` (nullable, ≤2000), `content` (nullable text, ≤100k), `language`, `contentType` (`TEXT`/`FILE`/`URL`), `url`, and tags through `ItemTag` → `Tag` (`@@unique([name, userId])`).

**No migration is required.** AI results go into existing fields (`description`, `content`, tags) once the user accepts them. An optional cache column is covered in §8.4.

---

## 3. Model Choice: `gpt-5-nano`

From OpenAI's model page (`developers.openai.com/api/docs/models/gpt-5-nano`):

| Property | Value |
|---|---|
| Price (per 1M tokens) | Input **$0.05**, cached input **$0.005**, output **$0.40** |
| Context | 400k total; 272k max input; 128k max output |
| Endpoints | Responses, Chat Completions, Batch |
| Features | Structured Outputs, streaming, reasoning tokens |
| Snapshot | `gpt-5-nano-2025-08-07` |
| Default rate limits | Tier 1 "Build": 5,000 RPM / 2M TPM. Ample for this app. |

**Caveats to know before building:**

1. **It's a reasoning model.** Reasoning tokens are billed as output and count against `max_output_tokens`. If the cap is tight and effort is high, the response can come back `status: "incomplete"` with **empty text**. Use `reasoning: { effort: "minimal" }` (or `"low"` for code explanation) on all four features. The GPT-5 family supports `minimal | low | medium | high`.
2. **Sampling parameters.** GPT-5-family reasoning models don't accept `temperature`/`top_p` the way `gpt-4o-mini` does. Steer length with `text: { verbosity: "low" | "medium" }` and the instructions instead.
3. **OpenAI now recommends newer small models for new work.** The `gpt-5-nano` page points new speed/cost workloads to `gpt-5.6-luna`, and `gpt-5.4-nano` is also available ($0.20 / $1.25 per 1M, `reasoning.effort` `none` default, with `low`/`medium`/`high`/`xhigh`). `gpt-5-nano` has **no deprecation notice** and is still the cheapest option, so it's fine to ship. Because the model is read from `OPENAI_MODEL`, upgrading later is just a config change. One caveat: valid `reasoning.effort` values differ between models (`minimal` vs `none`), so keep effort in the same config module as the model name.
4. `context/project-overview.md` and `CLAUDE.md` still say `gpt-4o-mini`. Update both to `gpt-5-nano` when the feature lands.

---

## 4. SDK Setup

### 4.1 Install

```bash
npm install openai server-only
```

`openai` v7 lists `zod: ^3.25 || ^4.0` as a peer dependency, which works with the project's `zod@^4.4.3`. `server-only` makes any accidental client import fail the build.

### 4.2 Environment

```bash
# .env / .env.example
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-nano          # optional; defaults in code
```

Never prefix these with `NEXT_PUBLIC_`.

### 4.3 `src/lib/openai.ts`

```ts
import "server-only";
import OpenAI from "openai";

// Null when unconfigured, so AI features can report "unavailable" rather than
// crashing the module at import time (same approach as the Redis client in rate-limit.ts).
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // The SDK default is 10 minutes, far too long for an interactive button.
      timeout: 30_000,
      maxRetries: 1,
    })
  : null;

export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-nano";

// gpt-5-nano accepts "minimal"; gpt-5.4+ models use "none". Change together with AI_MODEL.
export const AI_REASONING_EFFORT = "minimal" as const;
```

Key SDK behavior (from the `openai-node` README):
- Errors throw subclasses of `OpenAI.APIError`: `BadRequestError` (400), `AuthenticationError` (401), `PermissionDeniedError` (403), `RateLimitError` (429), `InternalServerError` (5xx), `APIConnectionError`, `APIConnectionTimeoutError`.
- 429s, 5xx, and connection errors are retried automatically (`maxRetries`, default 2).
- Per-request overrides: `client.responses.create(body, { timeout, maxRetries, signal })`.
- `response._request_id` holds the `x-request-id` header. Log it on failures.

### 4.4 `src/lib/ai.ts`: prompts, schemas, and helpers

Keep prompts and output schemas in one place so actions stay thin and the helpers can be unit-tested:

```ts
import "server-only";
import * as z from "zod";
import { TAG_MAX, TAGS_MAX, DESCRIPTION_MAX } from "@/lib/validations/items";

// Cap what is sent to the model, independent of CONTENT_MAX (100k). About 4 chars per token.
export const AI_INPUT_MAX_CHARS = 12_000;

export function truncateForAi(text: string): string {
  return text.length > AI_INPUT_MAX_CHARS
    ? `${text.slice(0, AI_INPUT_MAX_CHARS)}\n…[truncated]`
    : text;
}

// Structured Outputs requires every field to be required; use .nullable() for optional ones.
export const tagSuggestionSchema = z.object({
  tags: z.array(z.string()).max(TAGS_MAX),
});

export const summarySchema = z.object({
  summary: z.string(),
});

export const promptOptimizationSchema = z.object({
  optimizedPrompt: z.string(),
  changes: z.array(z.string()), // short bullets explaining what changed and why
});
```

Model output must still be **re-validated** before it reaches the UI (e.g. run tags through the existing `tagsSchema` and clamp each to `TAG_MAX`, slice the summary to `DESCRIPTION_MAX`). The JSON schema guarantees the structure, but not those limits.

---

## 5. Feature Designs

All four features accept the item's fields **from the client** (title, content, language, type) instead of an `itemId`. That lets them work in the New Item dialog and in edit mode before saving, and avoids a DB round trip. This is safe because the caller only sends text they already have. Results are never persisted by the AI action itself; the existing `createItem`/`updateItem` actions save them after the user accepts.

### 5.1 Auto-tagging (non-streaming, structured)

- **Where:** "Suggest tags" button next to the Tags field in `ItemEditForm.tsx` and `NewItemDialog.tsx`
- **Input:** title, content (truncated), language, type name, current tags, and the user's **existing tag names** (top ~50 by usage), so the model reuses `react` rather than inventing `reactjs`
- **Output:** `{ tags: string[] }` → filter through `tagsSchema`, drop tags already on the item, keep at most 5
- **Settings:** `reasoning: { effort: "minimal" }`, `text: { verbosity: "low" }`, `max_output_tokens: 1000`

### 5.2 AI summary (non-streaming, structured)

- **Where:** "Generate description" button beside the Description field (edit form + new item dialog)
- **Input:** title, type, language, content (truncated); for links, the URL
- **Output:** `{ summary }`, 1–2 sentences, sliced to `DESCRIPTION_MAX`
- **Note:** It's short, so streaming gains nothing. A spinner for 1–3 s is fine.

### 5.3 Explain This Code (streaming)

- **Where:** "Explain" button in `ItemDetailView.tsx` for `Snippet` and `Command` types, shown in a collapsible panel under the code
- **Input:** content (truncated), language, title
- **Output:** Markdown text, streamed. Rendered with the existing `react-markdown`.
- **Settings:** `reasoning: { effort: "low" }`, `text: { verbosity: "medium" }`, `max_output_tokens: 2500`
- **Why streaming:** It's the only feature with long output (several paragraphs). Streaming gives first text in about 1 s, instead of a 5–10 s blank spinner.
- **Persistence:** Ephemeral. Clear it when the drawer closes. A "Copy" button lets users save it into a note.

### 5.4 Prompt optimizer (non-streaming, structured)

- **Where:** "Optimize" button in edit mode for `Prompt` items
- **Input:** the prompt content (truncated)
- **Output:** `{ optimizedPrompt, changes[] }`. The `changes` list is what makes the result trustworthy enough to accept.
- **UI:** Side-by-side or tabbed "Original / Optimized" comparison with a change list → **Accept** replaces the form's `content` (still unsaved), **Discard** closes the panel
- **Streaming?** No. Accept/reject needs the complete result, and structured output can't be shown until it's parsed. If latency turns out to be a problem, stream only the `optimizedPrompt` as text and drop `changes`.

### 5.5 Streaming vs non-streaming at a glance

| | Non-streaming (Server Action) | Streaming (Route Handler) |
|---|---|---|
| Best for | Short, structured, accept/reject outputs | Long free-text output read as it arrives |
| Features | Tags, summary, prompt optimizer | Explain This Code |
| Return shape | `ActionResult<T>`, same as every other action | `text/plain` stream; JSON errors with HTTP status before the stream starts |
| Validation of output | Full (Zod) | None needed. It's display-only markdown. |
| Concurrency | Next 16 dispatches Server Functions **one at a time** per client (`07-mutating-data.md`). Fine for a single button click. | Independent fetches, cancellable with `AbortController` |

Streaming from a Server Action is possible (returning a `ReadableStream`, or the AI SDK's `createStreamableValue`), but the queueing above means a long stream would block every other action on the page (favorite toggles, saves) until it finishes. A Route Handler avoids that and matches the existing `/api/upload` pattern.

---

## 6. Server Action Pattern

### 6.1 `src/actions/ai.ts`

```ts
"use server";

import * as z from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL, AI_REASONING_EFFORT } from "@/lib/openai";
import { tagSuggestionSchema, truncateForAi, TAGGING_INSTRUCTIONS } from "@/lib/ai";
import { aiRateLimit, aiDailyRateLimit, checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { canUseProFeature } from "@/lib/usage-limits";
import { runAction, type ActionResult } from "@/lib/action-result";
import { CONTENT_MAX, TITLE_MAX } from "@/lib/validations/items";

const aiItemInputSchema = z.object({
  title: z.string().max(TITLE_MAX),
  typeName: z.string().max(50),
  content: z.string().max(CONTENT_MAX).nullable().optional(),
  language: z.string().max(50).nullable().optional(),
  tags: z.array(z.string()).max(20).default([]),
});

// Shared preamble for every AI action: auth → Pro gate → rate limit → client available.
async function authorizeAiCall(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const gate = await canUseProFeature(session.user.id, "AI features");
  if (!gate.allowed) return { ok: false, error: gate.error };

  for (const limiter of [aiRateLimit, aiDailyRateLimit]) {
    const result = await checkRateLimit(limiter, session.user.id);
    if (!result.success) return { ok: false, error: rateLimitMessage(result.reset) };
  }

  if (!openai) return { ok: false, error: "AI features are not available right now." };
  return { ok: true, userId: session.user.id };
}

export async function suggestTags(input: unknown): Promise<ActionResult<{ tags: string[] }>> {
  return runAction("suggestTags", async () => {
    const authz = await authorizeAiCall();
    if (!authz.ok) return { success: false, error: authz.error };

    const parsed = aiItemInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid input" };

    const existingTags = await prisma.tag.findMany({
      where: { userId: authz.userId },
      select: { name: true },
      take: 50,
    });

    const response = await openai!.responses.parse({
      model: AI_MODEL,
      instructions: TAGGING_INSTRUCTIONS, // static, so it can hit the prompt cache (§8)
      input: buildTaggingInput(parsed.data, existingTags.map((t) => t.name)),
      reasoning: { effort: AI_REASONING_EFFORT },
      text: { verbosity: "low", format: zodTextFormat(tagSuggestionSchema, "tag_suggestions") },
      max_output_tokens: 1000,
      store: false,
      safety_identifier: hashUserId(authz.userId),
    });

    const result = readParsed(response); // handles refusal / incomplete (§7.2)
    if (!result.ok) return { success: false, error: result.error };

    return { success: true, data: { tags: cleanSuggestedTags(result.value.tags, parsed.data.tags) } };
  });
}
```

`generateSummary` and `optimizePrompt` follow the same shape. Things to keep consistent with the existing actions:
- `"use server"` at the top; every export is wrapped in `runAction`
- Auth is checked first, then the Pro gate, then rate limits, **then** Zod parsing. That way, unauthorized or free users never consume rate-limit tokens on bad input and can't probe validation.
- Use `parsed.error.issues[0]?.message` for user-facing validation messages, matching `items.ts`
- Return `{ success, data, error }`; never throw to the client

### 6.2 `src/app/api/ai/explain/route.ts` (streaming)

```ts
import { NextResponse } from "next/server";
import * as z from "zod";
import { auth } from "@/auth";
import { openai, AI_MODEL } from "@/lib/openai";
import { EXPLAIN_INSTRUCTIONS, truncateForAi } from "@/lib/ai";
import { aiRateLimit, aiDailyRateLimit, checkRateLimit, retryAfterSeconds } from "@/lib/rate-limit";
import { canUseProFeature } from "@/lib/usage-limits";
import { CONTENT_MAX } from "@/lib/validations/items";

export const maxDuration = 60;

const explainSchema = z.object({
  content: z.string().min(1).max(CONTENT_MAX),
  language: z.string().max(50).nullable().optional(),
  title: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const gate = await canUseProFeature(session.user.id, "AI features");
  if (!gate.allowed) {
    return NextResponse.json({ success: false, error: gate.error }, { status: 403 });
  }
  // ...both rate limiters → 429 with Retry-After, mirroring /api/upload
  // ...openai null → 503
  const parsed = explainSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const stream = await openai!.responses.create(
    {
      model: AI_MODEL,
      instructions: EXPLAIN_INSTRUCTIONS,
      input: buildExplainInput(parsed.data),
      reasoning: { effort: "low" },
      text: { verbosity: "medium" },
      max_output_tokens: 2500,
      store: false,
      stream: true,
    },
    // Cancels the upstream OpenAI call (and its billing) when the user closes the drawer.
    { signal: request.signal },
  );

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            controller.enqueue(encoder.encode(event.delta));
          } else if (event.type === "response.failed" || event.type === "error") {
            controller.enqueue(encoder.encode("\n\n_Explanation failed. Please try again._"));
            break;
          }
        }
      } catch (error) {
        console.error("explain stream failed:", error);
        controller.enqueue(encoder.encode("\n\n_Explanation failed. Please try again._"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no", // Next 16 streaming guide: prevents proxy buffering
    },
  });
}
```

Notes:
- Errors found **before** the stream starts (auth, gate, 429, validation, OpenAI rejecting the request) return JSON with a real HTTP status. Once streaming has begun, the status is already 200, so failures are appended in-band as a final line.
- `maxDuration = 60` (Next 16 `route-segment-config/maxDuration.md`) keeps Vercel from cutting off long explanations.
- Wrap the `responses.create` call in try/catch so an OpenAI error before the first byte becomes a 502 JSON response.

### 6.3 Client consumption of the stream

```ts
const controller = new AbortController();
const res = await fetch("/api/ai/explain", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content, language, title }),
  signal: controller.signal,
});
if (!res.ok) {
  const { error } = await res.json();
  toast.error(error);
  return;
}
const reader = res.body!.getReader();
const decoder = new TextDecoder();
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  setExplanation((prev) => prev + decoder.decode(value, { stream: true }));
}
```

Call `controller.abort()` in the effect cleanup and when the drawer switches items.

---

## 7. Error Handling and Rate Limiting

### 7.1 Map OpenAI errors to user messages

Add a helper to `src/lib/ai.ts` and call it from a `catch` inside each AI action, **before** `runAction`'s generic fallback:

| SDK error | Cause | User message |
|---|---|---|
| `RateLimitError` (429) | Our org hit OpenAI limits or quota | "AI is busy right now. Please try again in a minute." |
| `APIConnectionTimeoutError` | Exceeded our 30 s timeout | "AI took too long to respond. Please try again." |
| `APIConnectionError`, `InternalServerError` | Network / OpenAI outage | "AI is temporarily unavailable." |
| `AuthenticationError`, `PermissionDeniedError` | Bad or revoked key | Generic message to the user; **log loudly** (this is an ops problem) |
| `BadRequestError` | Our bug (schema, params, input too large) | Generic message; log with `_request_id` |

Always log `error.status`, `error.request_id`, and the action name. Never log the item content.

### 7.2 Model-level failures (no exception thrown)

`readParsed(response)` should handle:
1. **Refusal:** a `message` output item whose content has `type: "refusal"`. Return "The AI couldn't process this content."
2. **Incomplete:** `response.status === "incomplete"` (usually `incomplete_details.reason === "max_output_tokens"`, often caused by reasoning tokens). Return a retry message, and keep an eye on how often it happens. If it's frequent, raise `max_output_tokens` or lower the reasoning effort.
3. **`output_parsed` is null:** treat as a generic failure.
4. **Empty result after cleaning** (e.g. every suggested tag already exists): return success with an empty array; the UI shows "No new tags to suggest."

### 7.3 Rate limits

Add to `src/lib/rate-limit.ts`, using the existing `createLimiter`:

```ts
// Shared across all four AI features; keyed by user ID, not IP.
export const aiRateLimit = createLimiter("ai", 20, "1 m");       // burst
export const aiDailyRateLimit = createLimiter("ai-daily", 300, "1 d"); // runaway / abuse cap
```

- Key by `session.user.id` (as `/api/upload` does), not IP. AI calls require a signed-in Pro user.
- **Fail-open trade-off:** `checkRateLimit` allows the request if Upstash is down. For auth endpoints that's a deliberate choice. Here the cost of failing open is bounded by the Pro gate, the input-size cap, and `max_output_tokens`, so worst-case spend during an outage is small. Keep fail-open for consistency, but also set a **monthly usage limit on the OpenAI project** in the OpenAI dashboard as a hard backstop.
- Client side: disable the button while a request is in flight, and don't trigger AI automatically on keystrokes. Every call is user-initiated.

---

## 8. Cost Optimization

### 8.1 Per-call estimates (gpt-5-nano)

| Feature | Input tokens | Output tokens (incl. reasoning) | Cost / call |
|---|---|---|---|
| Auto-tag | ~2,000 | ~300 | ~$0.00022 |
| Summary | ~2,000 | ~200 | ~$0.00018 |
| Prompt optimizer | ~1,500 | ~800 | ~$0.00040 |
| Explain code | ~3,000 | ~1,000 | ~$0.00055 |

A heavy user making 1,000 calls/month costs about **$0.30–$0.55**. Even a user maxing the daily cap (300 × 30 = 9,000 explain calls) costs about $5, still under the $8 plan price.

### 8.2 Levers, in order of impact

1. **Cap input size.** `truncateForAi` at ~12k chars (about 3k tokens). Items can be up to 100k chars, so without a cap one call could cost 8× more.
2. **Minimal reasoning effort plus a `max_output_tokens` cap per feature.** Reasoning tokens are the largest hidden cost on nano.
3. **`text.verbosity: "low"`** for tags and summary.
4. **Prompt caching (automatic):** OpenAI caches prompt prefixes of 1,024+ tokens, and cached input is billed at $0.005/1M (10× cheaper). Put the **static instructions and few-shot examples first** (`instructions`) and the per-item content last (`input`). The cache only kicks in if instructions are at least ~1k tokens, so don't pad them artificially.
5. **Request only what's needed:** e.g. send only the first ~4k chars for tagging. Topic detection doesn't need the whole file.
6. **Batch API (50% off)** doesn't fit interactive features. It's only worth considering later for a "tag all my untagged items" backfill job.

### 8.3 Monitoring

Log `response.usage` (`input_tokens`, `output_tokens`, `output_tokens_details.reasoning_tokens`, `input_tokens_details.cached_tokens`) per action name. That's enough to spot a feature whose reasoning tokens blow up, without building a usage table.

### 8.4 Optional: cache explanations

If Explain turns out to be popular, add `aiExplanation String?` and `aiExplanationHash String?` to `Item` (via `prisma migrate dev`, never `db push`), and reuse the cached text while `sha256(content)` is unchanged. This is not needed for v1.

---

## 9. Pro Gating Patterns

### 9.1 Server (the real gate)

- Every AI Server Action and the explain Route Handler call `canUseProFeature(userId, "AI features")`. It reads `isPro` from the DB, so a cancelled subscription loses access immediately, without waiting for a JWT refresh.
- Use the single feature string `"AI features"` so the error reads "AI features requires DevStash Pro", matching the plan copy.
- Do **not** tie this to `isBillingEnforced()`. Like Pro item types, AI is always gated (see the comment in `usage-limits.ts`).

### 9.2 Client (presentation only)

- Pass `isPro` from `currentUser` into `ItemDrawerProvider` / `ItemDrawer` → `ItemDetailView` and `ItemEditForm`. It's already passed to `NewItemDialog`.
- **Free users see the AI buttons, locked:** a Sparkles icon plus a `PRO` badge (as in `AppSidebar` and `NewItemDialog` for File/Image). Clicking opens a small popover with "Upgrade to Pro" linking to `/upgrade`, or navigates there directly. Hiding the buttons entirely would hide the upsell.
- Even if the UI is bypassed, the server still returns `{ success: false, error: "AI features requires DevStash Pro" }` → toast.

---

## 10. UI Patterns

### 10.1 Shared `AiButton` component

`src/components/ai/AiButton.tsx`: a `Button variant="outline" size="sm"` with:
- **Idle:** `Sparkles` icon + label ("Suggest tags", "Generate description", "Explain", "Optimize")
- **Pending:** `Loader2` with `animate-spin`, disabled, label "Thinking…", `aria-busy="true"`
- **Locked (free):** `PRO` badge, opens the upgrade prompt
- Use `useTransition` for Server Action calls (matches `ItemDrawer.tsx`), and `toast.error(result.error)` on failure.

### 10.2 Accept / reject per feature

| Feature | Suggestion UI | Accept | Reject |
|---|---|---|---|
| Tags | Dashed-outline `Badge` chips under the Tags input, each with a ✓ and ×; plus "Add all" | Appends to the form's `tags` string (no save yet) | Removes the chip |
| Summary | Muted preview box under Description: text + "Use this" / "Discard" / "Regenerate" | Replaces (or fills, if empty) the form's `description` | Clears the preview |
| Prompt optimizer | `Tabs`: Original / Optimized, plus the `changes` bullet list | Replaces form `content`; the user still clicks Save | Closes the panel |
| Explain | Collapsible panel; markdown streams in with a blinking cursor; "Stop" while streaming; "Copy" when done | n/a (read-only) | Collapse/close aborts the stream |

Principles:
- **Never auto-save AI output.** Accepted suggestions only change form state. The existing Save button and `updateItem`/`createItem` validation stay the single write path. This also means AI output always passes through `createItemSchema`/`updateItemSchema`.
- **Show something within ~300 ms:** spinner on the button immediately; for Explain, a skeleton line until the first chunk arrives.
- **Disable the trigger when there's nothing to analyze** (empty content), with a tooltip explaining why.
- **Mark AI-generated content** with a small "AI suggestion" label so users know to review it.
- **Accessibility:** wrap the suggestion region in `aria-live="polite"` so screen readers announce when suggestions appear; give icon-only accept/reject buttons `aria-label`s.

---

## 11. Security Considerations

### 11.1 API key handling
- `OPENAI_API_KEY` is used only in `src/lib/openai.ts`, which starts with `import "server-only"`. Never use `NEXT_PUBLIC_`.
- Use a **dedicated OpenAI project and key** for DevStash with a monthly budget cap, separate keys for dev and prod, and rotate the key if it ever appears in logs.
- The browser never talks to OpenAI directly. All calls go through the authenticated Server Actions or Route Handler.

### 11.2 Input handling
- Zod-validate every input with the existing limits (`CONTENT_MAX`, `TITLE_MAX`), then `truncateForAi` before sending.
- **Treat item content as untrusted data, not instructions (prompt injection).** A saved prompt like "ignore previous instructions and…" is ordinary content in this app; Prompt items are literally instructions for LLMs. Mitigations:
  - Put the task in `instructions` (system/developer role) and the item in `input`, wrapped in clear delimiters (e.g. `<item_content>…</item_content>`), with an instruction to treat everything inside as data to analyze.
  - Use Structured Outputs for tags, summary, and optimizer, so injected text can only affect the *values*, not the shape.
  - The impact is limited anyway: the model has **no tools**, no access to other users' data, and its output only reaches the same user as a suggestion they must accept.
- Only the user's own tag names are sent as context (`where: { userId }`).

### 11.3 Output handling
- Re-validate structured output (tags → `tagsSchema`, summary → `DESCRIPTION_MAX`).
- Render Explain markdown with `react-markdown` **without** `rehype-raw`, so raw HTML in model output is escaped (no XSS). Don't add `dangerouslySetInnerHTML` anywhere.
- Accepted values go through the normal `updateItem` validation.

### 11.4 Data privacy
- Set `store: false` on every Responses call so OpenAI doesn't keep response objects for later retrieval. (API data isn't used for training by default either way.)
- Send `safety_identifier` as a **hash** of the user ID (never the email), so OpenAI's abuse detection can attribute misuse to one end user instead of flagging the whole org key.
- Don't log prompts or item content; log only action name, user ID, token usage, and request ID.
- Add a line to the privacy policy / Pro features copy saying AI features send item content to OpenAI.

---

## 12. Testing

Following the project convention (Vitest, `*.test.ts` next to the code):

- **`src/lib/ai.test.ts`:** `truncateForAi`, `cleanSuggestedTags` (lowercase, de-dupe, drop existing, clamp length/count), `readParsed` (refusal, incomplete, success), error mapping.
- **`src/actions/ai.test.ts`:** mock `@/auth`, `@/lib/usage-limits`, `@/lib/rate-limit`, `@/lib/prisma`, and `@/lib/openai` (`vi.mock("@/lib/openai", () => ({ openai: { responses: { parse: vi.fn() } }, AI_MODEL: "test" }))`). Cases: unauthorized, free user blocked, rate limited, invalid input, `openai` null, refusal, success, and OpenAI `RateLimitError` mapped to its user message.
- **Never call the real API in tests.**
- Manual browser check: free user sees locked buttons; Pro user accepts and rejects each suggestion type; Explain stream aborts when the drawer closes (check the network tab).

---

## 13. Implementation Order

| # | Step | Files |
|---|---|---|
| 1 | Install `openai`, `server-only`; add `OPENAI_MODEL` to `.env.example` | `package.json`, `.env.example` |
| 2 | OpenAI client + AI helpers/prompts/schemas + tests | `src/lib/openai.ts`, `src/lib/ai.ts`, `src/lib/ai.test.ts` |
| 3 | AI rate limiters | `src/lib/rate-limit.ts` |
| 4 | `suggestTags` action + tests → tag-chip UI | `src/actions/ai.ts`, `src/actions/ai.test.ts`, `src/components/ai/*`, `ItemEditForm.tsx`, `NewItemDialog.tsx` |
| 5 | Pass `isPro` into the drawer tree | `ItemDrawerProvider.tsx`, `ItemDrawer.tsx`, `ItemDetailView.tsx` |
| 6 | `generateSummary` + preview UI | same files |
| 7 | `optimizePrompt` + compare UI | same files |
| 8 | `/api/ai/explain` streaming route + Explain panel | `src/app/api/ai/explain/route.ts`, `ItemDetailView.tsx` |
| 9 | Update docs: `gpt-4o-mini` → `gpt-5-nano` | `CLAUDE.md`, `context/project-overview.md` |

Step 4 alone is a shippable first PR and exercises the whole pipeline (gate → limit → structured output → accept UI).

---

## 14. Open Questions

1. **Model:** ship on `gpt-5-nano` (cheapest), or start on `gpt-5.4-nano` / `gpt-5.6-luna`, which OpenAI now recommends for new workloads? Since the model is a config value, this can be settled by A/B-ing output quality on a few real items.
2. **Daily cap:** is 300 AI calls/day/user the right abuse ceiling?
3. **Explain persistence:** ephemeral only (v1 recommendation), or cache on the item (§8.4)?
4. **Upsell for free users:** locked button + popover (recommended), or a short free trial (e.g. 5 AI calls) to demo value?

---

## Sources

- OpenAI model page, GPT-5 nano: https://developers.openai.com/api/docs/models/gpt-5-nano
- OpenAI model page, GPT-5.4 nano: https://developers.openai.com/api/docs/models/gpt-5.4-nano
- OpenAI model page, GPT-5 (reasoning effort values): https://developers.openai.com/docs/models/gpt-5
- OpenAI Structured Outputs guide: https://developers.openai.com/api/docs/guides/structured-outputs.md
- `openai-node` README (errors, retries, timeouts, streaming, request IDs): https://github.com/openai/openai-node/blob/main/README.md
- `openai-node` helpers (`zodTextFormat`, `responses.parse`): https://github.com/openai/openai-node/blob/main/helpers.md
- Zod / Structured Outputs version issue thread: https://community.openai.com/t/structured-outputs-example-broken-node-js-triggering-zod-version-discovered/1338894
- GPT-5 nano verbosity/minimal-effort example: https://benjamincrozat.com/gpt-5-nano-api
- Streaming LLM responses in Next.js: https://upstash.com/blog/sse-streaming-llm-responses, https://www.mctaba.com/kb/streaming-llm-responses-nextjs
- Proxy buffering report: https://discourse.sst.dev/t/next-js-api-route-streaming-data/2979
- Local Next.js 16.2.6 docs: `node_modules/next/dist/docs/01-app/02-guides/streaming.md`, `03-api-reference/03-file-conventions/route.md`, `03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md`, `01-getting-started/07-mutating-data.md`
- Codebase: `src/lib/usage-limits.ts`, `src/lib/rate-limit.ts`, `src/lib/action-result.ts`, `src/actions/items.ts`, `src/app/api/upload/route.ts`, `src/lib/validations/items.ts`, `src/lib/plans.ts`, `prisma/schema.prisma`
