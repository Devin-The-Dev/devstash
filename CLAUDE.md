# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # run ESLint
```

No test runner is configured.

## Stack

- **Next.js 16.2.6** with App Router (`src/app/`)
- **React 19.2.4**
- **TypeScript** (strict mode, path alias `@/*` → `src/*`)
- **Tailwind CSS v4** — CSS-based config only; use `@theme` in `globals.css`. No `tailwind.config.ts/js`
- **ESLint 9** with `eslint-config-next` (core-web-vitals + typescript presets)
- **Neon** (PostgreSQL) + **Prisma 7** ORM
- **NextAuth v5** (email/password + GitHub OAuth)
- **Cloudflare R2** for file storage
- **OpenAI** (`gpt-4o-mini`) for AI features
- **shadcn/ui** components + **Lucide React** icons
- **Stripe** for billing

## Architecture

App Router only — no Pages Router. All routes live under `src/app/`. The root layout (`src/app/layout.tsx`) sets metadata and wraps all pages.

**Planned file organization:**
- `src/components/[feature]/ComponentName.tsx`
- `src/app/[route]/page.tsx`
- `src/actions/[feature].ts` — Server Actions
- `src/types/[feature].ts`
- `src/lib/[utility].ts`

**Data fetching pattern:** Server components fetch directly via Prisma. Client components use Server Actions. Validate inputs with Zod. Actions return `{ success, data, error }`.

**DB rule:** Never use `prisma db push`. All schema changes go through `prisma migrate dev` → `prisma migrate deploy` in prod.

## Project Context

Full project spec, data model, and feature list are in `context/project-overview.md`. Coding standards are in `context/coding-standards.md`. Workflow rules are in `context/ai-interaction.md`.

## Workflow

1. Document the feature in `context/current-feature.md`
2. Create branch: `feature/[name]` or `fix/[name]`
3. Implement
4. Verify in browser + run `npm run build` (fix all errors before committing)
5. Commit only after build passes and with user permission
6. Merge to main, delete branch

**Never commit without explicit user approval. Never put "Generated With Claude" in commit messages.**

Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. This version (16.2.6) has APIs and conventions that may differ significantly from training data.
