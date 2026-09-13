"use client";

import type { KeyboardEvent } from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FALLBACK_FILE_ICON, fileExtensionIconMap, getFileExtension } from "@/lib/file-extension-icons";
import { formatDate, formatFileSize } from "@/lib/format";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import type { ItemSummary } from "@/lib/db/items";

export function FileListItem({ item }: { item: ItemSummary }) {
  const { openItem } = useItemDrawer();
  const Icon = fileExtensionIconMap[getFileExtension(item.fileName ?? item.title)] ?? FALLBACK_FILE_ICON;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItem(item.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer flex-col gap-2 border-b p-3 last:border-b-0 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icon className="size-6 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{item.title}</span>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 pl-9 text-xs text-muted-foreground sm:pl-0">
        <span>{item.fileSize != null ? formatFileSize(item.fileSize) : "—"}</span>
        <span>{formatDate(item.createdAt)}</span>
        <a
          href={`/api/items/${item.id}/download`}
          onClick={(event) => event.stopPropagation()}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Download className="size-4" />
        </a>
      </div>
    </div>
  );
}
