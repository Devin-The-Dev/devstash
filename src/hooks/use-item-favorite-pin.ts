import type { useTransition } from "react";
import { toggleItemFavorite, toggleItemPinned } from "@/actions/items";
import type { DrawerItem } from "@/hooks/use-item-detail";

type StartTransition = ReturnType<typeof useTransition>[1];
type Router = { refresh: () => void };

export function useItemFavoritePin(
  item: DrawerItem | null,
  patchItem: (patch: Partial<DrawerItem>) => void,
  startTransition: StartTransition,
  router: Router,
) {
  function toggleFavorite() {
    if (!item) return;
    const nextIsFavorite = !item.isFavorite;
    patchItem({ isFavorite: nextIsFavorite });
    startTransition(async () => {
      const actionResult = await toggleItemFavorite(item.id);
      if (!actionResult.success) {
        patchItem({ isFavorite: !nextIsFavorite });
      } else {
        router.refresh();
      }
    });
  }

  function togglePinned() {
    if (!item) return;
    const nextIsPinned = !item.isPinned;
    patchItem({ isPinned: nextIsPinned });
    startTransition(async () => {
      const actionResult = await toggleItemPinned(item.id);
      if (!actionResult.success) {
        patchItem({ isPinned: !nextIsPinned });
      } else {
        router.refresh();
      }
    });
  }

  return { toggleFavorite, togglePinned };
}
