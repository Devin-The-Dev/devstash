import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionsSection } from "@/components/dashboard/CollectionsSection";
import { PinnedItemsSection } from "@/components/dashboard/PinnedItemsSection";
import { RecentItemsSection } from "@/components/dashboard/RecentItemsSection";
import { getCollectionsPage, getFavoriteCollectionsCount } from "@/lib/db/collections";
import { getDashboardItems } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { DASHBOARD_COLLECTIONS_LIMIT, DASHBOARD_RECENT_ITEMS_LIMIT } from "@/lib/pagination";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const [collectionsPage, favoriteCollections, { totalItems, favoriteItems, pinnedItems, recentItems }] =
    await Promise.all([
      getCollectionsPage(currentUser.id, 1, DASHBOARD_COLLECTIONS_LIMIT),
      getFavoriteCollectionsCount(currentUser.id),
      getDashboardItems(currentUser.id, DASHBOARD_RECENT_ITEMS_LIMIT),
    ]);

  const { collections: topCollections, totalCount: totalCollections } = collectionsPage;

  return (
    <main className="flex-1 space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back, {currentUser.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          You have {totalItems} items across {totalCollections} collections.
        </p>
      </div>

      <StatsCards
        totalItems={totalItems}
        totalCollections={totalCollections}
        favoriteItems={favoriteItems}
        favoriteCollections={favoriteCollections}
      />

      <CollectionsSection collections={topCollections} />

      <PinnedItemsSection items={pinnedItems} />

      <RecentItemsSection items={recentItems} />
    </main>
  );
}
