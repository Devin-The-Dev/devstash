import { notFound } from "next/navigation";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { CollectionDetailActions } from "@/components/collections/CollectionDetailActions";
import { getItemsByCollection } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const result = await getItemsByCollection(currentUser.id, id);

  if (!result) notFound();

  const { collection, items } = result;

  return (
    <main className="flex-1 space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <CollectionDetailActions collection={collection} />
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No items in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
