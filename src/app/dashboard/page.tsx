import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionsSection } from "@/components/dashboard/CollectionsSection";
import { PinnedItemsSection } from "@/components/dashboard/PinnedItemsSection";
import { RecentItemsSection } from "@/components/dashboard/RecentItemsSection";
import { currentUser, items } from "@/lib/mock-data";
import { getCollectionsWithStats } from "@/lib/db/collections";

export default async function DashboardPage() {
  const recentCollections = await getCollectionsWithStats();

  const totalItems = items.length;
  const totalCollections = recentCollections.length;
  const favoriteItems = items.filter((item) => item.isFavorite).length;
  const favoriteCollections = recentCollections.filter((collection) => collection.isFavorite).length;

  const pinnedItems = items.filter((item) => item.isPinned);

  const recentItems = [...items]
    .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
    .slice(0, 10);

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

      <CollectionsSection collections={recentCollections} />

      <PinnedItemsSection items={pinnedItems} />

      <RecentItemsSection items={recentItems} />
    </main>
  );
}
