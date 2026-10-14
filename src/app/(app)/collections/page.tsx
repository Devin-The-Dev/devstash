import { FolderOpen } from "lucide-react";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getCollectionsPage } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";
import { formatCount } from "@/lib/format";
import { COLLECTIONS_PER_PAGE, parsePageParam, totalPagesFor } from "@/lib/pagination";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePageParam((await searchParams).page);
  const currentUser = await getCurrentUser();
  const { collections, totalCount } = await getCollectionsPage(
    currentUser.id,
    page,
    COLLECTIONS_PER_PAGE,
  );
  const totalPages = totalPagesFor(totalCount, COLLECTIONS_PER_PAGE);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">
          {formatCount(totalCount, "collection")}
        </p>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No collections yet"
          description="Group related items into a collection to find them faster."
          action={<NewCollectionDialog variant="cta" />}
        />
      ) : collections.length === 0 ? (
        <p className="text-muted-foreground">No collections on this page.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}

      <PaginationControls currentPage={page} totalPages={totalPages} basePath="/collections" />
    </div>
  );
}
