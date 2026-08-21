# Item Types Documentation

> Generated documentation for DevStash's 7 item types

---

## Overview

DevStash uses 7 system-defined item types to categorize developer resources. Each type has a name, icon, color, and content-storage method. System types are seeded with `isSystem: true` and `userId: null`, making them shared/read-only across all users. Custom user-defined item types are a planned Pro feature (see `context/project-overview.md`) but are **not yet implemented** — today `ItemType.userId` is nullable in the schema to support them later, but no code path creates one.

---

## Item Types Reference

Routes below (`/items/{slug}`) are what the sidebar links to (`src/components/dashboard/AppSidebar.tsx:92`, slug = `${name.toLowerCase()}s`). **These routes do not exist yet** — there is no `src/app/items/` directory in the codebase. Linking to them currently 404s.

### 1. Snippet

| Property    | Value       |
| ----------- | ----------- |
| **Name**    | `Snippet`   |
| **Icon**    | `Code`      |
| **Color**   | `#3b82f6` (blue) |
| **Content** | TEXT        |
| **Route**   | `/items/snippets` (not yet built) |

**Purpose:** Store reusable code blocks, functions, patterns, and boilerplate code.

**Key Fields Used:**
- `content` — the code content (text)
- `language` — programming language for syntax highlighting (e.g. `"typescript"`, `"yaml"`, `"bash"`)
- `description` — explanation of what the code does

---

### 2. Prompt

| Property    | Value       |
| ----------- | ----------- |
| **Name**    | `Prompt`    |
| **Icon**    | `Sparkles`  |
| **Color**   | `#8b5cf6` (purple) |
| **Content** | TEXT        |
| **Route**   | `/items/prompts` (not yet built) |

**Purpose:** Save AI prompts, system messages, and prompt templates with placeholders.

**Key Fields Used:**
- `content` — the prompt text, often with `{{placeholder}}` variables (e.g. `{{diff}}`, `{{source}}`, `{{code}}` in the seed data)
- `description` — what the prompt is designed to accomplish

---

### 3. Command

| Property    | Value       |
| ----------- | ----------- |
| **Name**    | `Command`   |
| **Icon**    | `Terminal`  |
| **Color**   | `#f97316` (orange) |
| **Content** | TEXT        |
| **Route**   | `/items/commands` (not yet built) |

**Purpose:** Store shell commands, scripts, and CLI one-liners for quick reference.

**Key Fields Used:**
- `content` — the command string
- `language` — typically `"bash"`
- `description` — what the command does and any important flags

---

### 4. Note

| Property    | Value       |
| ----------- | ----------- |
| **Name**    | `Note`      |
| **Icon**    | `StickyNote` |
| **Color**   | `#fde047` (yellow) |
| **Content** | TEXT        |
| **Route**   | `/items/notes` (not yet built) |

**Purpose:** General-purpose notes, documentation, explanations, and reference material.

**Key Fields Used:**
- `content` — free-form text content
- `description` — brief summary

---

### 5. Link

| Property    | Value       |
| ----------- | ----------- |
| **Name**    | `Link`      |
| **Icon**    | `Link` (rendered via `LinkIcon` alias, since `Link` collides with `next/link`) |
| **Color**   | `#10b981` (emerald) |
| **Content** | URL         |
| **Route**   | `/items/links` (not yet built) |

**Purpose:** Bookmark documentation, tools, articles, and external resources.

**Key Fields Used:**
- `url` — the external URL
- `description` — what the resource contains or why it's useful

---

### 6. File (Pro only)

| Property    | Value       |
| ----------- | ----------- |
| **Name**    | `File`      |
| **Icon**    | `File`      |
| **Color**   | `#6b7280` (gray) |
| **Content** | FILE        |
| **Route**   | `/items/files` (not yet built) |

**Purpose:** Upload and store documents, configuration files, and other file types.

**Key Fields Used:**
- `fileUrl`, `fileName`, `fileSize` — populated when content is uploaded to Cloudflare R2
- `description` — what the file contains

---

### 7. Image (Pro only)

| Property    | Value       |
| ----------- | ----------- |
| **Name**    | `Image`     |
| **Icon**    | `Image` (rendered via `ImageIcon` alias, since `Image` collides with `next/image`) |
| **Color**   | `#ec4899` (pink) |
| **Content** | FILE        |
| **Route**   | `/items/images` (not yet built) |

**Purpose:** Store screenshots, diagrams, design assets, and visual references.

**Key Fields Used:**
- `fileUrl`, `fileName`, `fileSize` — populated when content is uploaded to Cloudflare R2
- `description` — what the image shows

---

## Content Type Classification

Items are classified by the `ContentType` enum (`prisma/schema.prisma:15`):

| ContentType | Item Types                       | Storage Method               |
| ----------- | --------------------------------- | ----------------------------- |
| `TEXT`      | Snippet, Prompt, Command, Note    | `content` field (`String?`, plain text — no `@db.Text`) |
| `FILE`      | File, Image                       | `fileUrl` (Cloudflare R2)      |
| `URL`       | Link                              | `url` field                    |

Note: `contentType` on `Item` is not derived from the item type automatically — it's set explicitly per item at creation time (see `prisma/seed.ts`), so it's possible in principle for an item's `contentType` to disagree with its type's expected content shape. There's no DB constraint enforcing the pairing.

---

## Sidebar / Pro Gating

`proItemTypeNames = new Set(["File", "Image"])` in `AppSidebar.tsx:33` drives the "PRO" badge — a badge is shown when the type name is in that set **and** `!currentUser.isPro`. Per `context/project-overview.md:398`, this gate is currently cosmetic only: *"All features are unlocked for all users during development. The pro gate is wired up but not enforced until launch."* There is no server-side check today preventing a free user from creating a File or Image item.

Sidebar item type ordering is not DB insertion order — it's pinned explicitly via `SYSTEM_TYPE_ORDER` in `src/lib/db/items.ts:31`: `["Snippet", "Prompt", "Command", "Note", "Link", "File", "Image"]`.

---

## Shared Item Fields

All items share these fields regardless of type (`prisma/schema.prisma:108-140`):

| Field         | Type          | Description                              |
| ------------- | ------------- | ----------------------------------------- |
| `id`          | `String`      | Unique identifier (cuid)                  |
| `title`       | `String`      | Display name for the item                 |
| `description` | `String?`     | Optional description text                 |
| `contentType` | `ContentType` | `TEXT`, `FILE`, or `URL`                  |
| `content`     | `String?`     | Text body (TEXT types)                    |
| `fileUrl`     | `String?`     | Cloudflare R2 URL (FILE types)            |
| `fileName`    | `String?`     | Original filename (FILE types)            |
| `fileSize`    | `Int?`        | Size in bytes (FILE types)                |
| `url`         | `String?`     | External URL (URL types)                  |
| `language`    | `String?`     | Syntax-highlighting language hint         |
| `isFavorite`  | `Boolean`     | User-marked as favorite                   |
| `isPinned`    | `Boolean`     | Pinned to top of lists                    |
| `lastUsedAt`  | `DateTime?`   | Drives "recent" sorting; falls back to `updatedAt` when null (`src/lib/db/items.ts:79`) |
| `createdAt`   | `DateTime`    | When the item was created                 |
| `updatedAt`   | `DateTime`    | Last modification time                    |
| `userId`      | `String`      | Owner of the item                         |
| `typeId`      | `String`      | FK to `ItemType` (relation field is `type`, **not** `itemType`) |
| `tags`        | `ItemTag[]`   | Join table to `Tag` (many-to-many)        |
| `collections` | `ItemCollection[]` | Join table to `Collection` (many-to-many) |

---

## Database Schema

### ItemType model (`prisma/schema.prisma:89-104`)

```prisma
model ItemType {
  id       String  @id @default(cuid())
  name     String
  icon     String
  color    String
  isSystem Boolean @default(false)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items                 Item[]
  defaultForCollections Collection[]

  @@unique([name, userId])
  @@index([userId])
}
```

No `@@map` — the table name is the Prisma-generated default, not `item_types`.

### Item model, relevant fields (`prisma/schema.prisma:108-140`)

```prisma
model Item {
  id          String      @id @default(cuid())
  title       String
  description String?
  contentType ContentType
  content     String?
  fileUrl     String?
  fileName    String?
  fileSize    Int?
  url         String?
  language    String?
  isFavorite  Boolean     @default(false)
  isPinned    Boolean     @default(false)
  lastUsedAt  DateTime?

  userId String
  typeId String
  type   ItemType @relation(fields: [typeId], references: [id])

  collections ItemCollection[]
  tags        ItemTag[]
  // ...
}
```

### System type seed values (`prisma/seed.ts:17-25`)

Seeded with stable IDs (`system-snippet`, `system-prompt`, etc.) so the seed is idempotent:

```ts
const SYSTEM_ITEM_TYPES = [
  { id: "system-snippet", name: "Snippet", icon: "Code", color: "#3b82f6" },
  { id: "system-prompt", name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { id: "system-command", name: "Command", icon: "Terminal", color: "#f97316" },
  { id: "system-note", name: "Note", icon: "StickyNote", color: "#fde047" },
  { id: "system-link", name: "Link", icon: "Link", color: "#10b981" },
  { id: "system-file", name: "File", icon: "File", color: "#6b7280" },
  { id: "system-image", name: "Image", icon: "Image", color: "#ec4899" },
] as const;
```

---

## Icon Rendering

Icons are resolved by name string via `itemTypeIconMap` in [src/lib/item-type-icons.tsx](../src/lib/item-type-icons.tsx):

```tsx
export const itemTypeIconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image: ImageIcon,
};

export function getItemTypeIcon(icon: string): LucideIcon {
  return itemTypeIconMap[icon] ?? Box;
}
```

`getItemTypeIcon` falls back to a generic `Box` icon for unmapped names, so a future custom (Pro) type with an unrecognized `icon` string won't crash rendering — it just renders a generic box.

## Color Usage

- Icon foreground: `style={{ color: type.color }}` (`AppSidebar.tsx:94`)
- Collection dominant-color border: `style={{ backgroundColor: collection.dominantColor ?? "#6b7280" }}` (`AppSidebar.tsx:140`) — falls back to the File/gray color when a collection has no dominant type color computed
- No 20%-opacity background tint is currently implemented in the sidebar (unlike icon foreground color, which is applied directly)

---

## Sources

- [prisma/schema.prisma](../prisma/schema.prisma) — `ItemType`, `Item`, `ContentType` enum
- [prisma/seed.ts](../prisma/seed.ts) — system type definitions and demo data
- [src/lib/item-type-icons.tsx](../src/lib/item-type-icons.tsx) — icon name → component map
- [src/lib/db/items.ts](../src/lib/db/items.ts) — `getSystemItemTypes`, sidebar ordering, dashboard item queries
- [src/components/dashboard/AppSidebar.tsx](../src/components/dashboard/AppSidebar.tsx) — sidebar rendering, Pro badge gating, route slugs
- [context/project-overview.md](../context/project-overview.md) — feature spec, Pro gating status, roadmap for custom types

---

*Last verified against codebase: 2026-08-21.*
