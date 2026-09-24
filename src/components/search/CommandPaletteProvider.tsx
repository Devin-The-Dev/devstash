"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GlobalSearchDialog } from "@/components/search/GlobalSearchDialog";
import type { SearchableItem } from "@/lib/db/items";

export type SearchableCollection = {
  id: string;
  name: string;
  itemCount: number;
};

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}

export function CommandPaletteProvider({
  children,
  items,
  collections,
}: {
  children: React.ReactNode;
  items: SearchableItem[];
  collections: SearchableCollection[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<CommandPaletteContextValue>(() => ({ open, setOpen }), [open]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <GlobalSearchDialog open={open} onOpenChange={setOpen} items={items} collections={collections} />
    </CommandPaletteContext.Provider>
  );
}
