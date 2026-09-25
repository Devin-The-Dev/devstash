import Link from "next/link";
import { FolderOpen, Star } from "lucide-react";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { FavoriteRowContent, favoriteRowClassName } from "@/components/favorites/FavoriteRow";
import { FavoritesSection } from "@/components/favorites/FavoritesSection";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { formatIsoDate } from "@/lib/format";

export default async function FavoritesPage() {
  const currentUser = await getCurrentUser();
  const [items, collections] = await Promise.all([
    getFavoriteItems(currentUser.id),
    getFavoriteCollections(currentUser.id),
  ]);
  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <main className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Favorites</h1>
        <p className="text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} · {collections.length}{" "}
          {collections.length === 1 ? "collection" : "collections"}
        </p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Star className="size-8" />
          <p className="font-medium text-foreground">No favorites yet</p>
          <p className="text-sm">Star an item or collection to pin it here for quick access.</p>
        </div>
      ) : (
        <div className="space-y-6 font-mono text-[13px]">
          <FavoritesSection title="Items" count={items.length}>
            {items.map((item) => (
              <FavoriteItemRow key={item.id} item={item} date={formatIsoDate(item.updatedAt)} />
            ))}
          </FavoritesSection>

          <FavoritesSection title="Collections" count={collections.length}>
            {collections.map((collection) => (
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
                  date={formatIsoDate(collection.updatedAt)}
                />
              </Link>
            ))}
          </FavoritesSection>
        </div>
      )}
    </main>
  );
}
