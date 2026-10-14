import { Clock } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getRecentItems } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { ITEMS_PER_PAGE, parsePageParam, totalPagesFor } from "@/lib/pagination";

export default async function RecentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePageParam((await searchParams).page);
  const currentUser = await getCurrentUser();
  const { items, totalCount } = await getRecentItems(currentUser.id, page, ITEMS_PER_PAGE);
  const totalPages = totalPagesFor(totalCount, ITEMS_PER_PAGE);

  return (
    <main className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Recent</h1>
        <p className="text-muted-foreground">Items you&apos;ve used most recently.</p>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Clock className="size-8" />
          <p className="font-medium text-foreground">Nothing here yet</p>
          <p className="text-sm">Items you create or open will show up here.</p>
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No items on this page.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <PaginationControls currentPage={page} totalPages={totalPages} basePath="/recent" />
    </main>
  );
}
