"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollectionActionsMenu } from "@/components/collections/CollectionActionsMenu";
import { getItemTypeIcon } from "@/lib/item-type-icons";
import { formatRelativeTime } from "@/lib/format";
import type { CollectionSummary } from "@/lib/db/collections";

export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  const router = useRouter();

  function goToCollection() {
    router.push(`/collections/${collection.id}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToCollection();
    }
  }

  return (
    // Default (not "sm") card size: this card has a header/title, unlike
    // the denser ItemCard, so it keeps the roomier default spacing.
    <Card
      role="link"
      tabIndex={0}
      onClick={goToCollection}
      onKeyDown={handleKeyDown}
      className="h-full cursor-pointer border-l-4 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: collection.dominantColor ?? undefined }}
    >
      <CardHeader>
        <CardTitle className="truncate">{collection.name}</CardTitle>
        <CardAction
          className="flex items-center gap-1"
          onClick={(event: MouseEvent) => event.stopPropagation()}
        >
          {collection.isFavorite && <Star className="size-4 fill-yellow-400 text-yellow-400" />}
          <CollectionActionsMenu collection={collection} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {collection.types.map((type) => {
              const Icon = getItemTypeIcon(type.icon);
              return <Icon key={type.id} className="size-3.5" style={{ color: type.color }} />;
            })}
          </div>
          <span>
            {collection.itemCount} items · {formatRelativeTime(collection.lastUsedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
