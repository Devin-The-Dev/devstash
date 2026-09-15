import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { getCollectionsWithStats } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";

export default async function CollectionsPage() {
  const currentUser = await getCurrentUser();
  const collections = await getCollectionsWithStats(currentUser.id);

  return (
    <main className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">
          {collections.length} {collections.length === 1 ? "collection" : "collections"}
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-muted-foreground">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </main>
  );
}
