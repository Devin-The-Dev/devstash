"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FormState = {
  name: string;
  description: string;
};

function emptyForm(): FormState {
  return { name: "", description: "" };
}

export function NewCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(emptyForm);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(emptyForm());
    }
  }

  const canSubmit = form.name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    startTransition(async () => {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error ?? "Failed to create collection");
        return;
      }
      toast.success("Collection created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" />}
        aria-label="New collection"
        className="@max-xl:size-8 @max-xl:px-0"
      >
        <FolderPlus className="size-4" />
        <span className="hidden @xl:inline">New collection</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Group related items together.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-collection-name">Name</Label>
            <Input
              id="new-collection-name"
              placeholder="e.g. React Patterns"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-collection-description">Description</Label>
            <Input
              id="new-collection-description"
              placeholder="Short summary"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
            {isPending ? "Creating..." : "Create collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
