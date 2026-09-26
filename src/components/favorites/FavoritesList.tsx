"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_FAVORITE_SORT,
  FAVORITE_SORT_OPTIONS,
  sortFavorites,
  type FavoriteSort,
} from "@/lib/favorites-sort";
import type { FavoriteCollection } from "@/lib/db/collections";
import type { FavoriteItem } from "@/lib/db/items";
import { FavoriteItemRow } from "./FavoriteItemRow";
import { FavoriteRowContent, favoriteRowClassName } from "./FavoriteRow";
import { FavoritesSection } from "./FavoritesSection";

// `date` is the server-formatted display string (see FavoriteItemRow);
// `updatedAt` is only used as the sort key.
type Dated<T> = T & { date: string };

export function FavoritesList({
  items,
  collections,
}: {
  items: Dated<FavoriteItem>[];
  collections: Dated<FavoriteCollection>[];
}) {
  const [sort, setSort] = useState<FavoriteSort>(DEFAULT_FAVORITE_SORT);

  const sortedItems = useMemo(
    () =>
      sortFavorites(items, sort, (item) => ({
        name: item.title,
        date: item.updatedAt,
        type: item.type.name,
      })),
    [items, sort],
  );
  const sortedCollections = useMemo(
    () =>
      sortFavorites(collections, sort, (collection) => ({
        name: collection.name,
        date: collection.updatedAt,
      })),
    [collections, sort],
  );

  return (
    <div className="space-y-6 font-mono text-[13px]">
      <div className="flex items-center justify-end gap-2 px-2">
        <label htmlFor="favorites-sort" className="text-xs text-muted-foreground">
          Sort by
        </label>
        <Select
          items={FAVORITE_SORT_OPTIONS}
          value={sort}
          onValueChange={(value) => value !== null && setSort(value)}
        >
          <SelectTrigger id="favorites-sort" size="sm" className="w-28 font-sans">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FAVORITE_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FavoritesSection title="Items" count={sortedItems.length}>
        {sortedItems.map((item) => (
          <FavoriteItemRow key={item.id} item={item} date={item.date} />
        ))}
      </FavoritesSection>

      <FavoritesSection title="Collections" count={sortedCollections.length}>
        {sortedCollections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.id}`}
            className={favoriteRowClassName}
          >
            <FavoriteRowContent
              icon={FolderOpen}
              title={collection.name}
              typeLabel="collection"
              meta={`${collection.itemCount} ${collection.itemCount === 1 ? "item" : "items"}`}
              date={collection.date}
            />
          </Link>
        ))}
      </FavoritesSection>
    </div>
  );
}
