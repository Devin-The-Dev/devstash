---
name: devstash-conventions
description: DevStash-specific architectural conventions worth knowing before auditing — data-fetching layer location, shared icon map, no directory-listing tool available
metadata:
  type: project
---

Data-fetching functions for server components live in `src/lib/db/[feature].ts` (e.g.
`getCollectionsWithStats()` in `collections.ts`, `getDashboardItems()`/`getSystemItemTypes()` in
`items.ts`) — this is an established convention beyond what CLAUDE.md documents (which only
mentions `src/lib/[utility].ts`). Expect new server-component data fetching to follow this
`src/lib/db/*.ts` pattern.

Item-type icon rendering is centralized in `src/lib/item-type-icons.tsx`
(`itemTypeIconMap: Record<string, LucideIcon>`), keyed by the exact Lucide icon name stored in
`ItemType.icon`. Three call sites read from this map: `ItemCard.tsx` (guards with `{Icon && ...}`),
`CollectionCard.tsx` and `AppSidebar.tsx` (both unguarded — `<Icon .../>` will throw if a type's
icon name isn't in the map). Currently safe only because all `ItemType` rows are system-seeded with
names that are in the map; will become a real crash risk once user-created custom item types ship
(planned Pro feature per `context/project-overview.md`).

**Tooling note:** in at least one audit session, no Bash/Glob/Grep tools were available to this
subagent — only `Read`/`Write`/`Edit`/`WebFetch`/`WebSearch`. Directory listing was impossible;
file discovery had to proceed by guessing conventional paths from `context/current-feature.md`
history and `package.json`. If tools are similarly restricted in a future session, read
`context/current-feature.md` first — its History section names most files that exist.
