import { Star } from "lucide-react";
import { FavoritesList } from "@/components/favorites/FavoritesList";
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
    <main className="min-w-0 flex-1 space-y-6 p-6">
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
        <FavoritesList
          items={items.map((item) => ({ ...item, date: formatIsoDate(item.updatedAt) }))}
          collections={collections.map((collection) => ({
            ...collection,
            date: formatIsoDate(collection.updatedAt),
          }))}
        />
      )}
    </main>
  );
}
