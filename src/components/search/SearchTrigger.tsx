"use client";

import { Search } from "lucide-react";
import { useCommandPalette } from "@/components/search/CommandPaletteProvider";

export function SearchTrigger() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">Search items, collections, tags...</span>
      <kbd className="hidden shrink-0 items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:flex">
        ⌘K
      </kbd>
    </button>
  );
}
