import type { useTransition } from "react";
import { toast } from "sonner";
import { toggleItemFavorite, toggleItemPinned } from "@/actions/items";
import type { DrawerItem } from "@/hooks/use-item-detail";

type StartTransition = ReturnType<typeof useTransition>[1];

// Both actions revalidate the app shell themselves, so no router.refresh().
export function useItemFavoritePin(
  item: DrawerItem | null,
  patchItem: (patch: Partial<DrawerItem>) => void,
  startTransition: StartTransition,
) {
  function toggleFavorite() {
    if (!item) return;
    const nextIsFavorite = !item.isFavorite;
    patchItem({ isFavorite: nextIsFavorite });
    startTransition(async () => {
      const actionResult = await toggleItemFavorite(item.id);
      if (!actionResult.success) {
        patchItem({ isFavorite: !nextIsFavorite });
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
        toast.error(actionResult.error);
        return;
      }
      toast.success(actionResult.data.isPinned ? "Item pinned" : "Item unpinned");
    });
  }

  return { toggleFavorite, togglePinned };
}
