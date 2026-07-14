# Current Feature

Dashboard Items — replace the dummy pinned/recent item data on the dashboard main area with real data from the Neon database via Prisma.

## Status

Completed

## Goals

- Replace mock data from `src/lib/mock-data.ts` with real data from the database for both pinned and recent items
- Create `src/lib/db/items.ts` with data fetching functions
- Fetch items directly in the server component
- Item card icon/border derived from the item type
- Display item type tags and everything currently shown (reference `context/screenshots/dashboard-ui-main.png` if needed)
- Update collection stats display
- If there are no pinned items, nothing should display in that section
- Layout and design should look the same as it does now — only the data source changes

## Notes

- Full spec: `context/features/dashboard-items-spec.md`

## History

<!-- Keep this updated. Earliest to latest -->

- **2026-06-03** — Initial Next.js 16.2.6 project scaffolded via Create Next App. Stack includes React 19, TypeScript (strict), Tailwind CSS v4, Prisma 7 + Neon, NextAuth v5, Cloudflare R2, OpenAI, shadcn/ui, and Stripe. Project context, CLAUDE.md, and coding standards added.
- **2026-06-13** — Dashboard UI Phase 1 of 3 completed. Initialized ShadCN UI, added base components, created the /dashboard route with dark mode by default, a top bar (DevStash branding, sidebar toggle, search, "New collection" and "New item" buttons), and placeholder Sidebar/Main sections.
- **2026-06-15** — Dashboard UI Phase 2 of 3 completed. Added a collapsible sidebar (icon-collapse on desktop, drawer on mobile) with Dashboard/Favorites/Recent nav, an Item Types section linking to /items/[type] (with PRO badges on Files/Images), Favorite and Recent collections sections from mock data, and a user avatar footer with Upgrade to Pro CTA. Moved branding out of the top bar and wired the sidebar toggle to the new SidebarTrigger.
- **2026-06-15** — Dashboard UI Phase 3 of 3 completed. Built the main dashboard content area on `feature/dashboard-phase-3`: a "Welcome back" header with item/collection totals, 4 stats cards (items, collections, favorite items, favorite collections), a Collections section (cards with favorite star, item-type icons, item count, last-used time), a Pinned items section, and a Recently used section (10 items). Added shared `ItemCard`/`CollectionCard` components, a `formatRelativeTime` helper, a shared `itemTypeIconMap`, and the shadcn `Card` component. Refactored `AppSidebar` to use the shared icon map. Verified with `npm run lint`, `tsc --noEmit`, dev server render, and `npm run build`.
- **2026-06-16** — Started Neon PostgreSQL + Prisma 7 setup. Feature spec documented in `context/features/database-spec.md`.
- **2026-06-16** — Implemented Neon + Prisma 7 on `feature/database-setup`. Installed `prisma@7`, `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`, `dotenv`, `tsx`. Key Prisma 7 breaking changes applied: `provider = "prisma-client"` with mandatory `output` in the generator, `url`/`directUrl` removed from `datasource` block (now live in `prisma.config.ts` and the adapter). Wrote `prisma.config.ts` (dotenv loads `.env.local` + `.env`, falls back `DIRECT_URL → DATABASE_URL` for CLI). Wrote `src/lib/prisma.ts` singleton with `PrismaNeon` adapter and hot-reload guard. Wrote `prisma/seed.ts` for 7 system ItemTypes with stable IDs. Created `.env.example`. Added `db:generate`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio` scripts. Ran `prisma migrate dev --name init` — migration `20260616201744_init` created and applied to Neon dev branch. Ran `prisma db seed` — all 7 system ItemTypes inserted. Verified `prisma generate`, `tsc --noEmit`, and `eslint` all pass clean.
- **2026-06-24** — Rewrote `prisma/seed.ts` on `feature/seed-data` per `context/features/seed-spec.md`. Added `bcryptjs` + `@types/bcryptjs`. Seed now upserts: the 7 system ItemTypes (unchanged), a demo user (`demo@devstash.io`, password hashed with bcryptjs at 12 rounds, `isPro: false`), 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources), and 18 items across them (3 snippets, 3 prompts, 1 snippet + 1 command + 2 links, 4 commands, 4 links — links use real URLs) joined via `ItemCollection`. All records use stable IDs so the seed is idempotent. Verified row counts after a fresh run and a re-run (1 user, 5 collections, 18 items, 18 item-collection links, 7 item types — no duplicates), plus `tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean.
- **2026-07-14** — Dashboard Collections completed on `feature/dashboard-collections` per `context/features/dashboard-collections-spec.md`. Added `src/lib/db/collections.ts` with `getCollectionsWithStats()`, querying the demo user's collections via Prisma and computing item count, most-recent activity, and per-type usage counts to derive a dominant item type. `src/app/dashboard/page.tsx` is now an async server component that fetches real collections directly (items/pinned/recent sections remain on mock data, unchanged). `CollectionCard` now shows a colored left border driven by the dominant item type (matching the existing `ItemCard` convention) plus icons for every type present in the collection; `CollectionsSection` gained a "Color-coded by dominant item type" subtitle. `formatRelativeTime` now accepts `Date | string` for real DB timestamps. Verified with `tsc --noEmit`, `npm run lint`, `npm run build`, and a headless-Chrome screenshot of `/dashboard` confirming the 5 real DB collections render with correct names, item counts, border colors, and type icons.
- **2026-07-14** — Dashboard Items completed on `feature/dashboard-items` per `context/features/dashboard-items-spec.md`. Added `src/lib/db/items.ts` with `getDashboardItems()`, a single Prisma query (items + type + tags + collections) that derives total/favorite counts, pinned items, and the 10 most recently used items sorted by `lastUsedAt ?? updatedAt`. `src/app/dashboard/page.tsx` now fetches collections and items in parallel and no longer imports mock items. `ItemCard`/`PinnedItemsSection`/`RecentItemsSection` now take the real `ItemSummary` shape instead of mock `Item`. Removed the now-unused `Item`/`ContentType` types and `items` array from `src/lib/mock-data.ts`. Enriched `prisma/seed.ts` with 24 tags (2 per item via a new `ItemTag` upsert helper), staggered `lastUsedAt` timestamps per item, and 2 pinned items (`useDebounce hook`, `Code review prompt`) — the prior seed left every item with null `lastUsedAt`, no tags, and `isPinned: false`, which would have made the pinned section and tag badges impossible to verify. Verified with `tsc --noEmit`, `npm run lint`, `npm run build`, and a headless-Chrome screenshot of `/dashboard` confirming 18 real items, correct pinned/recent sections, tag badges, and type-colored borders/icons.
