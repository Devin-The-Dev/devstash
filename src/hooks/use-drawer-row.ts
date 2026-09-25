import type { KeyboardEvent } from "react";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";

export function useDrawerRowProps(itemId: string) {
  const { openItem } = useItemDrawer();

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Ignore keys bubbling up from nested controls (copy, favorite, download)
    // so activating them doesn't also open the drawer.
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItem(itemId);
    }
  }

  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: () => openItem(itemId),
    onKeyDown,
  };
}
