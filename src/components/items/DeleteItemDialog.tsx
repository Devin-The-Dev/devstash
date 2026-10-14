"use client";

import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

type DeleteItemDialogProps = {
  itemTitle: string | null;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteItemDialog({ itemTitle, ...props }: DeleteItemDialogProps) {
  return (
    <ConfirmDeleteDialog
      {...props}
      title="Delete this item?"
      description={
        <>
          {itemTitle ? `"${itemTitle}" will be permanently deleted.` : "This item will be permanently deleted."}{" "}
          This action cannot be undone.
        </>
      }
    />
  );
}
