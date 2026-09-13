---
name: devstash-decomposition-findings
description: Recurring decomposition/duplication issues found in a 2026-09-13 code-decomposition-only audit — ItemDrawer size, duplicated type-conditional field rendering, duplicated copy-to-clipboard and drawer-row-click patterns
metadata:
  type: project
---

A 2026-09-13 audit scoped specifically to decomposition (no security/perf) found these recurring
patterns worth checking again in future passes, since they're likely to grow rather than shrink as
more item types/features are added:

1. **`src/components/items/ItemDrawer.tsx` is 514 lines**, mixing data fetching (raw `fetch` +
   manual loading/error state instead of the rest of the app's Server Action convention), optimistic
   favorite/pin mutations, a full inline edit-form, delete-confirmation dialog, and a large
   type-conditional view-mode JSX tree, all in one client component. Already self-flagged in
   `context/current-feature.md`'s 2026-09-13 "audit quick wins" entry as "left for a future pass" —
   still true, not yet split.

2. **`ItemDrawer.tsx` and `src/components/items/NewItemDialog.tsx` duplicate an identical set of
   type-name arrays** (`CONTENT_TYPES`, `CODE_TYPES`, `MARKDOWN_TYPES`, `LANGUAGE_TYPES`,
   `URL_TYPES`) and the entire "pick CodeEditor vs MarkdownEditor vs Textarea vs Input based on
   `type.name`" conditional block, once for create and once for edit. No shared constants module or
   shared field-renderer component exists yet for this.

3. **The "copy to clipboard, show a checkmark for 1500ms" pattern is duplicated four times**:
   `src/components/dashboard/ItemCard.tsx`, `src/components/items/ItemDrawer.tsx`,
   `src/components/items/CodeEditor.tsx`, `src/components/items/MarkdownEditor.tsx`. No
   `useCopyToClipboard` hook exists; `src/lib/` has no `hooks` subfolder or `src/hooks/` directory
   at all yet.

4. **The "clickable row/card that opens the item drawer via keyboard + click" pattern is duplicated**
   between `ItemCard.tsx` (`<div role="button" tabIndex={0} onKeyDown=...>`, added when the copy
   button forced a move off a native `<button>`) and `FileListItem.tsx` (copy-pasted the same
   div/role/tabIndex/onKeyDown block). `ImageThumbnailCard.tsx` still uses a plain `<button>` since
   it has no nested interactive element, so it's the odd one out, not a duplicate.

**How to apply:** If a future feature touches any of these four files again, that's a natural
moment to suggest the corresponding extraction rather than adding a fifth duplicate. See
[[devstash-project-state]] for what's shipped overall.
