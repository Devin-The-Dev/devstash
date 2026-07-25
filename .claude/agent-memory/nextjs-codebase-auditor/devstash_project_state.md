---
name: devstash-project-state
description: DevStash is an early-stage Next.js app — only the read-only dashboard is built; auth, Server Actions, Stripe, R2, and OpenAI are not implemented yet
metadata:
  type: project
---

As of 2026-07-18, DevStash (`/Users/devinudy/projects/devstash`) has only the dashboard read path built:
`src/app/dashboard/page.tsx` + `src/app/dashboard/layout.tsx`, backed by `src/lib/db/collections.ts`
and `src/lib/db/items.ts` (Prisma direct-fetch in server components), rendering via
`src/components/dashboard/*`. `package.json` has no `zod`, `next-auth`, `stripe`, `openai`, or R2/S3
SDK dependencies — those integrations described in `context/project-overview.md` are aspirational,
not yet started. There is no `src/actions/`, `src/types/`, or `src/app/api/` directory yet.

Auth is explicitly not wired up: both `src/lib/db/collections.ts` and `src/lib/db/items.ts` hardcode
`const DEMO_USER_ID = "demo-user"` (duplicated in both files — a real DRY finding) and scope every
query to it. `src/lib/mock-data.ts` still exports a separate, disconnected `currentUser` mock
(`id: "user_1"`, `name: "Alex Doe"`) used purely for display (sidebar greeting/avatar/isPro flag),
which doesn't match the real seeded demo user (`prisma/seed.ts`: id `demo-user`, name `Demo User`,
email `demo@devstash.io`). This mismatch is a legitimate Medium-severity finding, not a missing-auth
issue.

**Why this matters for future audits:** Per the audit mandate, do not flag missing auth/Server
Actions/Zod validation/Stripe webhook verification/R2 authorization as issues — none of that code
exists yet, it's not a regression. Progress is tracked feature-by-feature in
`context/current-feature.md`'s History section, which is the fastest way to learn what's actually
been built before starting a new audit pass — read it first.

**How to apply:** Before flagging "missing X" in a future audit of this repo, check
`context/current-feature.md` history and `package.json` deps to confirm whether X was ever meant to
exist yet. Re-verify this snapshot against current `package.json`/`context/current-feature.md`
before trusting it, since this project is actively being built out feature by feature.
