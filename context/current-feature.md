# Current Feature

Seed Data — populate the dev database with a demo user, sample collections, and sample items per `context/features/seed-spec.md`.

## Status

Completed

## Goals

- Demo user: demo@devstash.io / Demo User, password "12345678" hashed with bcryptjs (12 rounds), isPro false, emailVerified set to now.
- Keep the 7 existing system ItemTypes (already seeded, idempotent upsert).
- 5 collections owned by the demo user: React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources.
- Items per spec: 3 snippets (React Patterns), 3 prompts (AI Workflows), 1 snippet + 1 command + 2 links (DevOps), 4 commands (Terminal Commands), 4 links (Design Resources) — links use real URLs.
- Seed must remain idempotent (safe to re-run via `npm run db:seed`).

## Notes

- Spec source: `context/features/seed-spec.md`.
- Existing system ItemType names are capitalized ("Snippet", "Prompt", ...) matching `src/lib/mock-data.ts` and `src/lib/item-type-icons.tsx` — keeping that casing instead of the lowercase names shown in the spec table for consistency with the rest of the codebase.
- `bcryptjs` is not yet a dependency; needs to be added.

## History

<!-- Keep this updated. Earliest to latest -->

- **2026-06-03** — Initial Next.js 16.2.6 project scaffolded via Create Next App. Stack includes React 19, TypeScript (strict), Tailwind CSS v4, Prisma 7 + Neon, NextAuth v5, Cloudflare R2, OpenAI, shadcn/ui, and Stripe. Project context, CLAUDE.md, and coding standards added.
- **2026-06-13** — Dashboard UI Phase 1 of 3 completed. Initialized ShadCN UI, added base components, created the /dashboard route with dark mode by default, a top bar (DevStash branding, sidebar toggle, search, "New collection" and "New item" buttons), and placeholder Sidebar/Main sections.
- **2026-06-15** — Dashboard UI Phase 2 of 3 completed. Added a collapsible sidebar (icon-collapse on desktop, drawer on mobile) with Dashboard/Favorites/Recent nav, an Item Types section linking to /items/[type] (with PRO badges on Files/Images), Favorite and Recent collections sections from mock data, and a user avatar footer with Upgrade to Pro CTA. Moved branding out of the top bar and wired the sidebar toggle to the new SidebarTrigger.
- **2026-06-15** — Dashboard UI Phase 3 of 3 completed. Built the main dashboard content area on `feature/dashboard-phase-3`: a "Welcome back" header with item/collection totals, 4 stats cards (items, collections, favorite items, favorite collections), a Collections section (cards with favorite star, item-type icons, item count, last-used time), a Pinned items section, and a Recently used section (10 items). Added shared `ItemCard`/`CollectionCard` components, a `formatRelativeTime` helper, a shared `itemTypeIconMap`, and the shadcn `Card` component. Refactored `AppSidebar` to use the shared icon map. Verified with `npm run lint`, `tsc --noEmit`, dev server render, and `npm run build`.
- **2026-06-16** — Started Neon PostgreSQL + Prisma 7 setup. Feature spec documented in `context/features/database-spec.md`.
- **2026-06-16** — Implemented Neon + Prisma 7 on `feature/database-setup`. Installed `prisma@7`, `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`, `dotenv`, `tsx`. Key Prisma 7 breaking changes applied: `provider = "prisma-client"` with mandatory `output` in the generator, `url`/`directUrl` removed from `datasource` block (now live in `prisma.config.ts` and the adapter). Wrote `prisma.config.ts` (dotenv loads `.env.local` + `.env`, falls back `DIRECT_URL → DATABASE_URL` for CLI). Wrote `src/lib/prisma.ts` singleton with `PrismaNeon` adapter and hot-reload guard. Wrote `prisma/seed.ts` for 7 system ItemTypes with stable IDs. Created `.env.example`. Added `db:generate`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio` scripts. Ran `prisma migrate dev --name init` — migration `20260616201744_init` created and applied to Neon dev branch. Ran `prisma db seed` — all 7 system ItemTypes inserted. Verified `prisma generate`, `tsc --noEmit`, and `eslint` all pass clean.
- **2026-06-24** — Rewrote `prisma/seed.ts` on `feature/seed-data` per `context/features/seed-spec.md`. Added `bcryptjs` + `@types/bcryptjs`. Seed now upserts: the 7 system ItemTypes (unchanged), a demo user (`demo@devstash.io`, password hashed with bcryptjs at 12 rounds, `isPro: false`), 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources), and 18 items across them (3 snippets, 3 prompts, 1 snippet + 1 command + 2 links, 4 commands, 4 links — links use real URLs) joined via `ItemCollection`. All records use stable IDs so the seed is idempotent. Verified row counts after a fresh run and a re-run (1 user, 5 collections, 18 items, 18 item-collection links, 7 item types — no duplicates), plus `tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean.
