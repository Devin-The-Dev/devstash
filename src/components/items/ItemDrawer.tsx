"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Box, Check, Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ItemEditForm, toEditForm, type EditForm } from "@/components/items/ItemEditForm";
import { ItemDetailView } from "@/components/items/ItemDetailView";
import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { formatDate } from "@/lib/format";
import { getCopyableValue } from "@/lib/item-content";
import { deleteItem, updateItem } from "@/actions/items";
import { useItemDetail } from "@/hooks/use-item-detail";
import { useItemFavoritePin } from "@/hooks/use-item-favorite-pin";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { CollectionOption } from "@/lib/db/collections";

export function ItemDrawer({ collections }: { collections: CollectionOption[] }) {
  const { openItemId, close } = useItemDrawer();
  const router = useRouter();
  const { item, status, patchItem } = useItemDetail(openItemId);
  const { copied, copy } = useCopyToClipboard();
  const [isPending, startTransition] = useTransition();
  const { toggleFavorite, togglePinned } = useItemFavoritePin(item, patchItem, startTransition, router);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastOpenItemId, setLastOpenItemId] = useState(openItemId);

  // Reset drawer-local state on open-item change here (not in a useEffect) per
  // the react-hooks/set-state-in-effect rule — this is the sanctioned pattern.
  if (openItemId !== lastOpenItemId) {
    setLastOpenItemId(openItemId);
    setMode("view");
    setEditForm(null);
    setDeleteDialogOpen(false);
  }

  async function handleCopy() {
    if (!item) return;
    const value = getCopyableValue(item);
    if (!value) return;
    await copy(value);
  }

  function handleStartEdit() {
    if (!item) return;
    setEditForm(toEditForm(item));
    setMode("edit");
  }

  function handleCancelEdit() {
    setEditForm(null);
    setMode("view");
  }

  function handleSave() {
    if (!item || !editForm) return;
    const title = editForm.title.trim();
    if (!title) return;

    const tags = editForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title,
      description: editForm.description.trim() || null,
      content: editForm.content.trim() || null,
      url: editForm.url.trim() || null,
      language: editForm.language.trim() || null,
      tags,
      collectionIds: editForm.collectionIds,
    };

    startTransition(async () => {
      const actionResult = await updateItem(item.id, payload);
      if (!actionResult.success) {
        toast.error(actionResult.error);
        return;
      }
      const updated = actionResult.data;
      patchItem({
        ...updated,
        lastUsedAt: updated.lastUsedAt ? new Date(updated.lastUsedAt).toISOString() : null,
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
      });
      setMode("view");
      setEditForm(null);
      toast.success("Item updated");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!item) return;
    startTransition(async () => {
      const actionResult = await deleteItem(item.id);
      if (!actionResult.success) {
        toast.error(actionResult.error);
        return;
      }
      setDeleteDialogOpen(false);
      toast.success("Item deleted");
      close();
      router.refresh();
    });
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
              {mode === "edit" ? (
                <div className="flex w-full items-center justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={isPending} onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={isPending || !editForm || editForm.title.trim().length === 0}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      disabled={isPending}
                      onClick={toggleFavorite}
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
                      onClick={togglePinned}
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
                    <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={handleStartEdit}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      disabled={isPending}
                      className="text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
              {mode === "edit" && editForm ? (
                <ItemEditForm
                  typeName={item.type.name}
                  form={editForm}
                  collections={collections}
                  onChange={setEditForm}
                />
              ) : (
                <>
                  <ItemDetailView item={item} />
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
                </>
              )}

              <Separator className="mt-auto" />
              <p className="text-xs text-muted-foreground">
                Created {formatDate(item.createdAt)} · Updated {formatDate(item.updatedAt)}
              </p>
            </div>
          </>
        )}
      </SheetContent>
      <DeleteItemDialog
        itemTitle={item?.title ?? null}
        open={deleteDialogOpen}
        isPending={isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </Sheet>
  );
}
