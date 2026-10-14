import Link from "next/link";
import { Clock } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { buttonVariants } from "@/components/ui/button";
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
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Recent</h1>
        <p className="text-muted-foreground">Items you&apos;ve used most recently.</p>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nothing here yet"
          description="Items you create or open will show up here."
          action={
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Go to dashboard
            </Link>
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

      <PaginationControls currentPage={page} totalPages={totalPages} basePath="/recent" />
    </div>
  );
}
