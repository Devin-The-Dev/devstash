"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CodeEditor } from "@/components/items/CodeEditor";
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
import type { ItemTypeSummary } from "@/lib/db/items";

const CONTENT_TYPES = ["Snippet", "Prompt", "Command", "Note"];
const CODE_TYPES = ["Snippet", "Command"];
const LANGUAGE_TYPES = ["Snippet", "Command"];
const URL_TYPES = ["Link"];

type CollectionOption = { id: string; name: string };

type FormState = {
  typeId: string;
  collectionId: string | null;
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
};

function emptyForm(typeId: string): FormState {
  return {
    typeId,
    collectionId: null,
    title: "",
    description: "",
    tags: "",
    content: "",
    language: "",
    url: "",
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
    (typeName !== "Link" || form.url.trim().length > 0);

  function handleSubmit() {
    if (!canSubmit) return;

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      typeId: form.typeId,
      collectionId: form.collectionId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      content: form.content.trim() || null,
      url: form.url.trim() || null,
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
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New item
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
              <Label>Collection</Label>
              <Select
                value={form.collectionId ?? "none"}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, collectionId: value === "none" ? null : (value as string) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {CODE_TYPES.includes(typeName) ? (
            <div className="space-y-1.5">
              <Label>Content</Label>
              <CodeEditor
                value={form.content}
                language={form.language}
                onChange={(content) => setForm((f) => ({ ...f, content }))}
              />
            </div>
          ) : (
            CONTENT_TYPES.includes(typeName) && (
              <div className="space-y-1.5">
                <Label htmlFor="new-item-content">Content</Label>
                <Textarea
                  id="new-item-content"
                  className="min-h-32 font-mono text-xs"
                  placeholder="Paste code, prompt, command, or notes…"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                />
              </div>
            )
          )}

          {LANGUAGE_TYPES.includes(typeName) && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-language">Language</Label>
              <Input
                id="new-item-language"
                placeholder="e.g. typescript"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              />
            </div>
          )}

          {URL_TYPES.includes(typeName) && (
            <div className="space-y-1.5">
              <Label htmlFor="new-item-url">URL</Label>
              <Input
                id="new-item-url"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
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
