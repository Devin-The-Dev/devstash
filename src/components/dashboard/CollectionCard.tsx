import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { formatRelativeTime } from "@/lib/format";
import { items, itemTypes, type Collection } from "@/lib/mock-data";

export function CollectionCard({ collection }: { collection: Collection }) {
  const typeIds = new Set(
    items
      .filter((item) => item.collectionIds.includes(collection.id))
      .map((item) => item.typeId)
  );
  const types = itemTypes.filter((type) => typeIds.has(type.id));

  return (
    <Link href={`/collections/${collection.id}`}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle className="truncate">{collection.name}</CardTitle>
          {collection.isFavorite && (
            <CardAction>
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {types.map((type) => {
                const Icon = itemTypeIconMap[type.icon];
                return <Icon key={type.id} className="size-3.5" style={{ color: type.color }} />;
              })}
            </div>
            <span>
              {collection.itemCount} items · {formatRelativeTime(collection.lastUsedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
