"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemContentFields } from "@/components/items/ItemContentFields";
import { CollectionMultiSelect } from "@/components/items/CollectionMultiSelect";
import { FileUpload, type UploadedFile } from "@/components/items/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createItem } from "@/actions/items";
import { CREATABLE_ITEM_TYPES } from "@/lib/validations/items";
import { FILE_TYPES } from "@/lib/item-type-groups";
import type { ItemTypeSummary } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";

type FormState = {
  typeId: string;
  collectionIds: string[];
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
  file: UploadedFile | null;
};

function emptyForm(typeId: string): FormState {
  return {
    typeId,
    collectionIds: [],
    title: "",
    description: "",
    tags: "",
    content: "",
    language: "",
    url: "",
    file: null,
  };
}

export function NewItemDialog({
  itemTypes,
  collections,
}: {
  itemTypes: ItemTypeSummary[];
  collections: CollectionOption[];
}) {
  const router = useRouter();
  const creatableTypes = itemTypes.filter((type) => CREATABLE_ITEM_TYPES.includes(type.name));
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => emptyForm(creatableTypes[0]?.id ?? ""));

  const typeName = creatableTypes.find((type) => type.id === form.typeId)?.name ?? "";

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(emptyForm(creatableTypes[0]?.id ?? ""));
    }
  }

  const canSubmit =
    form.title.trim().length > 0 &&
    form.typeId.length > 0 &&
    (typeName !== "Link" || form.url.trim().length > 0) &&
    (!FILE_TYPES.includes(typeName) || form.file !== null);

  function handleSubmit() {
    if (!canSubmit) return;

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      typeId: form.typeId,
      collectionIds: form.collectionIds,
      title: form.title.trim(),
      description: form.description.trim() || null,
      content: form.content.trim() || null,
      url: form.url.trim() || null,
      fileUrl: form.file?.fileUrl ?? null,
      fileName: form.file?.fileName ?? null,
      fileSize: form.file?.fileSize ?? null,
      language: form.language.trim() || null,
      tags,
    };

    startTransition(async () => {
      const result = await createItem(payload);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Item created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button />}
        aria-label="New item"
        className="@max-xl:size-8 @max-xl:px-0"
      >
        <Plus className="size-4" />
        <span className="hidden @xl:inline">New item</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, or link to your stash.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.typeId}
                onValueChange={(value) => setForm((f) => ({ ...f, typeId: value as string }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {creatableTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Collections</Label>
              <CollectionMultiSelect
                collections={collections}
                selectedIds={form.collectionIds}
                onChange={(collectionIds) => setForm((f) => ({ ...f, collectionIds }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-item-title">Title</Label>
            <Input
              id="new-item-title"
              placeholder="e.g. useDebounce hook"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-item-description">Description</Label>
            <Input
              id="new-item-description"
              placeholder="Short summary"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-item-tags">Tags</Label>
            <Input
              id="new-item-tags"
              placeholder="comma, separated, tags"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>

          {FILE_TYPES.includes(typeName) ? (
            <div className="space-y-1.5">
              <Label>File</Label>
              <FileUpload
                kind={typeName === "Image" ? "image" : "file"}
                value={form.file}
                onChange={(file) => setForm((f) => ({ ...f, file }))}
              />
            </div>
          ) : (
            <ItemContentFields
              idPrefix="new-item"
              typeName={typeName}
              content={form.content}
              language={form.language}
              url={form.url}
              onContentChange={(content) => setForm((f) => ({ ...f, content }))}
              onLanguageChange={(language) => setForm((f) => ({ ...f, language }))}
              onUrlChange={(url) => setForm((f) => ({ ...f, url }))}
              contentPlaceholder="Paste code, prompt, command, or notes…"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
            {isPending ? "Creating..." : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
