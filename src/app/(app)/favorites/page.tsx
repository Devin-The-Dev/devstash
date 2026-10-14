import Link from "next/link";
import { Star } from "lucide-react";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import { EmptyState } from "@/components/shared/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { formatCount, formatRelativeTime } from "@/lib/format";

export default async function FavoritesPage() {
  const currentUser = await getCurrentUser();
  const [items, collections] = await Promise.all([
    getFavoriteItems(currentUser.id),
    getFavoriteCollections(currentUser.id),
  ]);
  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <div className="min-w-0 flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Favorites</h1>
        <p className="text-muted-foreground">
          {formatCount(items.length, "item")} · {formatCount(collections.length, "collection")}
        </p>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Star}
          title="No favorites yet"
          description="Star an item or collection to pin it here for quick access."
          action={
            <Link href="/collections" className={buttonVariants({ variant: "outline" })}>
              Browse collections
            </Link>
          }
        />
      ) : (
        <FavoritesList
          items={items.map((item) => ({ ...item, date: formatRelativeTime(item.updatedAt) }))}
          collections={collections.map((collection) => ({
            ...collection,
            date: formatRelativeTime(collection.updatedAt),
          }))}
        />
      )}
    </div>
  );
}
