import Link from "next/link";
import { Pin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { formatRelativeTime } from "@/lib/format";
import type { ItemSummary } from "@/lib/db/items";

export function ItemCard({ item }: { item: ItemSummary }) {
  const Icon = itemTypeIconMap[item.type.icon];
  const href = item.collectionId ? `/collections/${item.collectionId}` : "/dashboard";

  return (
    <Link href={href}>
      <Card
        size="sm"
        className="h-full border-l-4 transition-colors hover:bg-accent/50"
        style={{ borderLeftColor: item.type.color }}
      >
        <CardContent className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {Icon && <Icon className="size-4 shrink-0" style={{ color: item.type.color }} />}
              <span className="truncate text-sm font-medium">{item.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
              {item.isPinned && <Pin className="size-3.5" />}
              {item.isFavorite && <Star className="size-3.5 fill-yellow-400 text-yellow-400" />}
            </div>
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(item.lastUsedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
