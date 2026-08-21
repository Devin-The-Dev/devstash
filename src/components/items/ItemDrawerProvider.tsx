"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { ItemDrawer } from "@/components/items/ItemDrawer";

type ItemDrawerContextValue = {
  openItemId: string | null;
  openItem: (itemId: string) => void;
  close: () => void;
};

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}

export function ItemDrawerProvider({ children }: { children: React.ReactNode }) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const value = useMemo<ItemDrawerContextValue>(
    () => ({
      openItemId,
      openItem: (itemId: string) => setOpenItemId(itemId),
      close: () => setOpenItemId(null),
    }),
    [openItemId],
  );

  return (
    <ItemDrawerContext.Provider value={value}>
      {children}
      <ItemDrawer />
    </ItemDrawerContext.Provider>
  );
}
