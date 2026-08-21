"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Box, Check, Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { formatDate } from "@/lib/format";
import { toggleItemFavorite, toggleItemPinned } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";

type DrawerItem = Omit<ItemDetail, "lastUsedAt" | "createdAt" | "updatedAt"> & {
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FetchResult = { id: string; item: DrawerItem } | { id: string; error: true };

export function ItemDrawer() {
  const { openItemId, close } = useItemDrawer();
  const router = useRouter();
  const [result, setResult] = useState<FetchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

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
  const status: "loading" | "loaded" | "error" = hasError ? "error" : item ? "loaded" : "loading";

  function patchItem(patch: Partial<DrawerItem>) {
    setResult((current) =>
      current && "item" in current ? { ...current, item: { ...current.item, ...patch } } : current,
    );
  }

  function handleToggleFavorite() {
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

  function handleTogglePinned() {
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

  async function handleCopy() {
    if (!item) return;
    const value = item.content ?? item.url ?? item.fileUrl ?? "";
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const Icon = item ? (itemTypeIconMap[item.type.icon] ?? Box) : Box;

  return (
    <Sheet open={openItemId !== null} onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex flex-col overflow-y-auto">
        {status === "loading" || !item ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Separator />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : status === "error" ? (
          <p className="p-4 text-sm text-muted-foreground">Couldn&apos;t load this item.</p>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Icon className="size-5 shrink-0" style={{ color: item.type.color }} />
                <SheetTitle className="truncate">{item.title}</SheetTitle>
              </div>
              <Badge variant="secondary" className="w-fit text-xs">
                {item.type.name}
              </Badge>
            </SheetHeader>

            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  disabled={isPending}
                  onClick={handleToggleFavorite}
                >
                  <Star
                    className={
                      item.isFavorite ? "size-4 fill-yellow-400 text-yellow-400" : "size-4"
                    }
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={item.isPinned ? "Unpin item" : "Pin item"}
                  disabled={isPending}
                  onClick={handleTogglePinned}
                >
                  <Pin
                    className={item.isPinned ? "size-4 fill-current text-primary" : "size-4"}
                  />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Copy" onClick={handleCopy}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Edit" disabled>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  disabled
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}

              {item.content && (
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                  {item.content}
                </pre>
              )}

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm text-primary hover:underline"
                >
                  {item.url}
                </a>
              )}

              {item.fileName && (
                <p className="text-sm text-muted-foreground">
                  {item.fileName}
                  {item.fileSize ? ` · ${Math.round(item.fileSize / 1024)} KB` : ""}
                </p>
              )}

              {item.language && (
                <Badge variant="secondary" className="w-fit text-xs">
                  {item.language}
                </Badge>
              )}

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {item.collections.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Collections</p>
                  <div className="flex flex-wrap gap-1">
                    {item.collections.map((collection) => (
                      <Badge key={collection.id} variant="outline" className="text-xs">
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="mt-auto" />
              <p className="text-xs text-muted-foreground">
                Created {formatDate(item.createdAt)} · Updated {formatDate(item.updatedAt)}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
