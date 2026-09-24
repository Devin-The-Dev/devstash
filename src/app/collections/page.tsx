import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getCollectionsPage } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";
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
    <main className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">
          {totalCount} {totalCount === 1 ? "collection" : "collections"}
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-muted-foreground">
          {totalCount === 0 ? "No collections yet." : "No collections on this page."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}

      <PaginationControls currentPage={page} totalPages={totalPages} basePath="/collections" />
    </main>
  );
}
