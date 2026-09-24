"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import { updateCollectionAction } from "@/actions/collections";

type EditableCollection = {
  id: string;
  name: string;
  description: string | null;
};

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: {
  collection: EditableCollection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Update this collection&apos;s name and description.</DialogDescription>
        </DialogHeader>

        {/* Mounted fresh each time the dialog opens, so form state always
            starts from the current collection metadata without an effect. */}
        {open && (
          <EditCollectionForm
            collection={collection}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditCollectionForm({
  collection,
  onOpenChange,
}: {
  collection: EditableCollection;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      const result = await updateCollectionAction(collection.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection updated");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-collection-name">Name</Label>
          <Input
            id="edit-collection-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-collection-description">Description</Label>
          <Input
            id="edit-collection-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  );
}
