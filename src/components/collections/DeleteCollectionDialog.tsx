"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { deleteCollectionAction } from "@/actions/collections";

export function DeleteCollectionDialog({
  collectionId,
  collectionName,
  open,
  onOpenChange,
  onDeleted,
}: {
  collectionId: string;
  collectionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCollectionAction(collectionId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection deleted");
      onOpenChange(false);
      onDeleted();
    });
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      isPending={isPending}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      title={<>Delete &quot;{collectionName}&quot;?</>}
      description={
        <>
          Items in this collection are not deleted — they&apos;ll just no longer be part of it.
          This action cannot be undone.
        </>
      }
    />
  );
}
