---
name: devstash-project-state
description: DevStash current build state as of 2026-09-13 — full auth, item/collection CRUD, R2 file uploads, Monaco/markdown editors, rate limiting all shipped; Stripe/AI/search/collections-CRUD still not built
metadata:
  type: project
---

As of 2026-09-13, DevStash (`/Users/devinudy/projects/devstash`) is well past the "dashboard-only"
stage recorded in the 2026-07-18 snapshot of this memory (now corrected). Read
`context/current-feature.md`'s History section first in any future audit — it is kept in strict
chronological order and is the fastest way to learn what's shipped.

**Shipped:** NextAuth v5 (email/password + GitHub OAuth, email verification, forgot/reset password,
rate limiting via Upstash), full Item CRUD (create/edit/delete/favorite/pin) via
`src/actions/items.ts` + `src/lib/db/items.ts`, an item drawer (`src/components/items/ItemDrawer.tsx`)
with view/edit modes, Monaco code editor + custom markdown editor, Cloudflare R2 file/image upload
with a download proxy route, `/items/[type]` list views (grid for most types, single-column for
File, thumbnail grid for Image), a profile page (change password, delete account, stats), and
per-user data scoping throughout (no more hardcoded demo user).

**Not yet built (do not flag as missing):** Stripe billing/webhooks, OpenAI features (auto-tag,
summaries, explain-code, prompt optimizer), full-text search (the `TopBar` search input is
non-functional/decorative), Collections CRUD UI (`/collections/[id]` and `/collections` routes
referenced by links don't exist yet — sidebar/card links to them are dead ends), `/favorites` and
`/recent` sidebar nav routes (also dead ends), custom user-created item types.

**Testing convention:** Vitest covers pure-logic functions and Server Actions
(`src/actions/items.test.ts`, `*.test.ts` next to helpers like `resolveMonacoLanguage`,
`file-extension-icons`, `upload-constraints`, `r2.ts`'s `keyFromPublicUrl`). Components, thin
Prisma-query DB-layer functions, and route handlers are intentionally left untested — this is an
established convention, not a gap to flag.

**How to apply:** Before flagging "missing X" in a future audit, check `context/current-feature.md`
history first. Re-verify this snapshot against current history before trusting it, since the project
is still actively being built feature-by-feature. See [[devstash-decomposition-findings]] for the
2026-09-13 decomposition-focused audit results.
