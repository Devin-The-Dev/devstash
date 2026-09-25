"use client";

import { ImageIcon, Pin } from "lucide-react";
import { FavoriteToggleButton } from "@/components/shared/FavoriteToggleButton";
import { toggleItemFavorite } from "@/actions/items";
import { useDrawerRowProps } from "@/hooks/use-drawer-row";
import type { ItemSummary } from "@/lib/db/items";

export function ImageThumbnailCard({ item }: { item: ItemSummary }) {
  // A div rather than a native <button> so the favorite toggle can nest inside.
  const drawerRowProps = useDrawerRowProps(item.id);

  return (
    <div className="block w-full cursor-pointer text-left" {...drawerRowProps}>
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
            <FavoriteToggleButton
              isFavorite={item.isFavorite}
              toggleAction={() => toggleItemFavorite(item.id)}
              className="text-white/80 hover:bg-white/15 hover:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
