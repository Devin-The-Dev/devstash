# Current Feature

Neon PostgreSQL + Prisma 7 database setup with initial schema and migrations.

## Status

In Progress

## Goals

- Configure Prisma 7 with Neon PostgreSQL (serverless) as the datasource
- Write the initial `schema.prisma` based on the data model in `project-overview.md`
- Include all NextAuth tables: `Account`, `Session`, `VerificationToken`
- Add appropriate indexes and cascade deletes
- Create the first migration via `prisma migrate dev` (never `db push`)
- Seed system `ItemType` records (Snippet, Prompt, Command, Note, Link, File, Image)
- Verify `prisma generate` and a successful dev-server DB connection

## Notes

- DATABASE_URL points to the **development** Neon branch; a separate production branch will be used in prod
- Always use `prisma migrate dev` locally → `prisma migrate deploy` in prod — never `prisma db push`
- Prisma 7 has breaking changes from v6; read the upgrade guide before touching any Prisma APIs
- The rough-draft schema is in `context/project-overview.md` — treat it as a starting point, not gospel
- System `ItemType` records are global (no `userId`); user-created types are pro-only and scoped to a user

## History

<!-- Keep this updated. Earliest to latest -->

- **2026-06-03** — Initial Next.js 16.2.6 project scaffolded via Create Next App. Stack includes React 19, TypeScript (strict), Tailwind CSS v4, Prisma 7 + Neon, NextAuth v5, Cloudflare R2, OpenAI, shadcn/ui, and Stripe. Project context, CLAUDE.md, and coding standards added.
- **2026-06-13** — Dashboard UI Phase 1 of 3 completed. Initialized ShadCN UI, added base components, created the /dashboard route with dark mode by default, a top bar (DevStash branding, sidebar toggle, search, "New collection" and "New item" buttons), and placeholder Sidebar/Main sections.
- **2026-06-15** — Dashboard UI Phase 2 of 3 completed. Added a collapsible sidebar (icon-collapse on desktop, drawer on mobile) with Dashboard/Favorites/Recent nav, an Item Types section linking to /items/[type] (with PRO badges on Files/Images), Favorite and Recent collections sections from mock data, and a user avatar footer with Upgrade to Pro CTA. Moved branding out of the top bar and wired the sidebar toggle to the new SidebarTrigger.
- **2026-06-15** — Dashboard UI Phase 3 of 3 completed. Built the main dashboard content area on `feature/dashboard-phase-3`: a "Welcome back" header with item/collection totals, 4 stats cards (items, collections, favorite items, favorite collections), a Collections section (cards with favorite star, item-type icons, item count, last-used time), a Pinned items section, and a Recently used section (10 items). Added shared `ItemCard`/`CollectionCard` components, a `formatRelativeTime` helper, a shared `itemTypeIconMap`, and the shadcn `Card` component. Refactored `AppSidebar` to use the shared icon map. Verified with `npm run lint`, `tsc --noEmit`, dev server render, and `npm run build`.
- **2026-06-16** — Started Neon PostgreSQL + Prisma 7 setup. Feature spec documented in `context/features/database-spec.md`.
- **2026-06-16** — Implemented Neon + Prisma 7 on `feature/database-setup`. Installed `prisma@7`, `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`, `dotenv`, `tsx`. Key Prisma 7 breaking changes applied: `provider = "prisma-client"` with mandatory `output` in the generator, `url`/`directUrl` removed from `datasource` block (now live in `prisma.config.ts` and the adapter). Wrote `prisma.config.ts` (dotenv loads `.env.local` + `.env`, falls back `DIRECT_URL → DATABASE_URL` for CLI). Wrote `src/lib/prisma.ts` singleton with `PrismaNeon` adapter and hot-reload guard. Wrote `prisma/seed.ts` for 7 system ItemTypes with stable IDs. Created `.env.example`. Added `db:generate`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio` scripts. Ran `prisma migrate dev --name init` — migration `20260616201744_init` created and applied to Neon dev branch. Ran `prisma db seed` — all 7 system ItemTypes inserted. Verified `prisma generate`, `tsc --noEmit`, and `eslint` all pass clean.
