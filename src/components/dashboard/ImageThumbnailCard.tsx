"use client";

import { ImageIcon, Pin, Star } from "lucide-react";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import type { ItemSummary } from "@/lib/db/items";

export function ImageThumbnailCard({ item }: { item: ItemSummary }) {
  const { openItem } = useItemDrawer();

  return (
    <button type="button" className="block w-full text-left" onClick={() => openItem(item.id)}>
      <div className="group relative aspect-video overflow-hidden rounded-lg border">
        {item.fileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.fileUrl}
            alt={item.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
          <span className="truncate text-sm font-medium text-white">{item.title}</span>
          <div className="flex shrink-0 items-center gap-1 text-white/80">
            {item.isPinned && <Pin className="size-3.5" />}
            {item.isFavorite && <Star className="size-3.5 fill-yellow-400 text-yellow-400" />}
          </div>
        </div>
      </div>
    </button>
  );
}
