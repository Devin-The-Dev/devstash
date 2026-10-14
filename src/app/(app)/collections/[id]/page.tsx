import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { CollectionDetailActions } from "@/components/collections/CollectionDetailActions";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getCollectionOptions } from "@/lib/db/collections";
import { getItemsByCollection, getSystemItemTypes } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { formatCount } from "@/lib/format";
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

  // Cached: the top bar already loads these for its New item dialog.
  const [itemTypes, collections] =
    totalCount === 0
      ? await Promise.all([getSystemItemTypes(), getCollectionOptions(currentUser.id)])
      : [[], []];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatCount(totalCount, "item")}
          </p>
        </div>
        <CollectionDetailActions collection={collection} />
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={Inbox}
          title="This collection is empty"
          description="Add an item to start filling it up."
          action={
            <NewItemDialog
              variant="cta"
              itemTypes={itemTypes}
              collections={collections.map(({ id, name }) => ({ id, name }))}
              isPro={currentUser.isPro}
              initialCollectionIds={[collection.id]}
            />
          }
        />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No items on this page.</p>
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
    </div>
  );
}
