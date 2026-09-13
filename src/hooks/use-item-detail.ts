import { useEffect, useState } from "react";
import type { ItemDetail } from "@/lib/db/items";

export type DrawerItem = Omit<ItemDetail, "lastUsedAt" | "createdAt" | "updatedAt"> & {
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FetchResult = { id: string; item: DrawerItem } | { id: string; error: true };

export type ItemDetailStatus = "loading" | "loaded" | "error";

export function useItemDetail(openItemId: string | null) {
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!openItemId) return;

    let cancelled = false;

    fetch(`/api/items/${openItemId}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setResult(json.success ? { id: openItemId, item: json.data } : { id: openItemId, error: true });
      })
      .catch(() => {
        if (!cancelled) setResult({ id: openItemId, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [openItemId]);

  const isCurrent = result !== null && result.id === openItemId;
  const item = isCurrent && "item" in result ? result.item : null;
  const hasError = isCurrent && "error" in result;
  const status: ItemDetailStatus = hasError ? "error" : item ? "loaded" : "loading";

  function patchItem(patch: Partial<DrawerItem>) {
    setResult((current) =>
      current && "item" in current ? { ...current, item: { ...current.item, ...patch } } : current,
    );
  }

  return { item, status, patchItem };
}
