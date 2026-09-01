"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Box, Check, Copy, Download, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { formatDate, formatFileSize } from "@/lib/format";
import { deleteItem, toggleItemFavorite, toggleItemPinned, updateItem } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";

type DrawerItem = Omit<ItemDetail, "lastUsedAt" | "createdAt" | "updatedAt"> & {
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FetchResult = { id: string; item: DrawerItem } | { id: string; error: true };

const CONTENT_TYPES = ["Snippet", "Prompt", "Command", "Note"];
const CODE_TYPES = ["Snippet", "Command"];
const MARKDOWN_TYPES = ["Note", "Prompt"];
const LANGUAGE_TYPES = ["Snippet", "Command"];
const URL_TYPES = ["Link"];

type EditForm = {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
};

function toEditForm(item: DrawerItem): EditForm {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    language: item.language ?? "",
    tags: item.tags.join(", "),
  };
}

export function ItemDrawer() {
  const { openItemId, close } = useItemDrawer();
  const router = useRouter();
  const [result, setResult] = useState<FetchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastOpenItemId, setLastOpenItemId] = useState(openItemId);

  if (openItemId !== lastOpenItemId) {
    setLastOpenItemId(openItemId);
    setMode("view");
    setEditForm(null);
    setDeleteDialogOpen(false);
  }

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
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  {CODE_TYPES.includes(item.type.name) ? (
                    <div className="space-y-1.5">
                      <Label>Content</Label>
                      <CodeEditor
                        value={editForm.content}
                        language={editForm.language}
                        onChange={(content) => setEditForm({ ...editForm, content })}
                      />
                    </div>
                  ) : MARKDOWN_TYPES.includes(item.type.name) ? (
                    <div className="space-y-1.5">
                      <Label>Content</Label>
                      <MarkdownEditor
                        value={editForm.content}
                        onChange={(content) => setEditForm({ ...editForm, content })}
                      />
                    </div>
                  ) : (
                    CONTENT_TYPES.includes(item.type.name) && (
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-content">Content</Label>
                        <Textarea
                          id="edit-content"
                          className="min-h-32 font-mono text-xs"
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        />
                      </div>
                    )
                  )}

                  {LANGUAGE_TYPES.includes(item.type.name) && (
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-language">Language</Label>
                      <Input
                        id="edit-language"
                        value={editForm.language}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                      />
                    </div>
                  )}

                  {URL_TYPES.includes(item.type.name) && (
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-url">URL</Label>
                      <Input
                        id="edit-url"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-tags">Tags</Label>
                    <Input
                      id="edit-tags"
                      placeholder="Comma-separated"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}

                  {item.content && CODE_TYPES.includes(item.type.name) && (
                    <CodeEditor value={item.content} language={item.language} readOnly />
                  )}

                  {item.content && MARKDOWN_TYPES.includes(item.type.name) && (
                    <MarkdownEditor value={item.content} readOnly />
                  )}

                  {item.content &&
                    !CODE_TYPES.includes(item.type.name) &&
                    !MARKDOWN_TYPES.includes(item.type.name) && (
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

                  {item.type.name === "Image" && item.fileUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="max-h-64 w-full rounded-md object-contain"
                    />
                  )}

                  {item.fileName && (
                    <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                      <p className="min-w-0 truncate text-sm text-muted-foreground">
                        {item.fileName}
                        {item.fileSize ? ` · ${formatFileSize(item.fileSize)}` : ""}
                      </p>
                      {item.type.name === "File" && (
                        <a
                          href={`/api/items/${item.id}/download`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <Download className="size-4" />
                          Download
                        </a>
                      )}
                    </div>
                  )}

                  {item.language && !(item.content && CODE_TYPES.includes(item.type.name)) && (
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
                </>
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {item ? `"${item.title}" will be permanently deleted.` : "This item will be permanently deleted."}{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
