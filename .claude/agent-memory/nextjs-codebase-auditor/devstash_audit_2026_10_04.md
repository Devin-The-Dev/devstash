---
name: devstash-audit-2026-10-04
description: Full-audit findings as of 2026-10-04 (Stripe/pagination/search era) - open issues to re-check next time, plus areas confirmed clean
metadata:
  type: project
---

Full audit on 2026-10-04: 0 Critical, 2 High, ~12 Medium, ~9 Low. Re-verify before repeating; fixed items should be dropped.

**Open High:** (1) credentials login rate limit lives only in the `signInWithCredentials` server
action, so `POST /api/auth/callback/credentials` (exported `handlers` in
`src/app/api/auth/[...nextauth]/route.ts`) bypasses it. (2) `/api/upload` buffers via
`request.formData()` and `/api/items/[id]/download` buffers via `transformToByteArray()`; image
cap is 5MB and file cap 10MB but Vercel functions cap request/response bodies at ~4.5MB (not
verified live).

**Open Medium themes:** `createItemSchema.fileUrl` is any `z.url()`, not bound to the user's R2
prefix, and `deleteItem` derives the R2 key from it; `deleteAccount` leaves R2 objects orphaned;
`src/actions/items.ts` and `collections.ts` have no try/catch (coding standard requires it);
duplicate tag names in one request hit the `ItemTag` composite PK; no `.max()` on any Zod string;
`getBaseUrl()` silently falls back to localhost in prod (caused a real checkout incident);
no `loading.tsx` anywhere checked (dashboard, items/[type]); layouts load ALL searchable items and
ALL collections-with-items on every navigation; no index on `ItemCollection.collectionId` or
`ItemTag.tagId`; `next.config.ts` has no security headers; download route filename with non-latin1
chars throws.

**Confirmed clean (don't re-scrutinize):** Stripe webhook signature verification and idempotent
sync, ownership scoping in `src/lib/db/*` and server actions (userId in every where), `.env*`
gitignored (only `.env.example` tracked), checkout/portal actions, proxy matcher plus per-route
`auth()` checks, getVisibleItemsFilter usage across listings.

**Tooling:** this session again had only Read/Write/Edit/WebFetch/WebSearch (no Bash/Glob/Grep) -
existence of files (e.g. `loading.tsx`) was tested by Read erroring. `context/current-feature.md`
is >25k tokens; read it in 20-24 line slices with offset.
