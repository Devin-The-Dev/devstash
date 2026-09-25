import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

type ToggleResult = { success: true; data: { isFavorite: boolean } } | { success: false; error: string };

// Optimistic favorite toggle. The action revalidates the app shell, so the
// fresh `isFavorite` prop arrives inside the same transition. On failure the
// optimistic value simply falls back to the unchanged prop.
export function useFavoriteToggle(isFavorite: boolean, toggleAction: () => Promise<ToggleResult>) {
  const [optimisticIsFavorite, setOptimisticIsFavorite] = useOptimistic(isFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setOptimisticIsFavorite(!optimisticIsFavorite);
      const result = await toggleAction();
      if (!result.success) toast.error(result.error);
    });
  }

  return { isFavorite: optimisticIsFavorite, toggle, isPending };
}
