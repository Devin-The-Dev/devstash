import { notFound } from "next/navigation";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { CollectionDetailActions } from "@/components/collections/CollectionDetailActions";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getItemsByCollection } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { ITEMS_PER_PAGE, parsePageParam, totalPagesFor } from "@/lib/pagination";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const page = parsePageParam((await searchParams).page);
  const currentUser = await getCurrentUser();
  const result = await getItemsByCollection(currentUser.id, id, page, ITEMS_PER_PAGE);

  if (!result) notFound();

  const { collection, items, totalCount } = result;
  const totalPages = totalPagesFor(totalCount, ITEMS_PER_PAGE);

  return (
    <main className="flex-1 space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </p>
        </div>
        <CollectionDetailActions collection={collection} />
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          {totalCount === 0 ? "No items in this collection yet." : "No items on this page."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        basePath={`/collections/${id}`}
      />
    </main>
  );
}
