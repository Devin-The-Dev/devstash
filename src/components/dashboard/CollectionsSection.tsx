import Link from "next/link";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import type { CollectionSummary } from "@/lib/db/collections";

export function CollectionsSection({ collections }: { collections: CollectionSummary[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Collections</h2>
          <p className="text-sm text-muted-foreground">Color-coded by dominant item type</p>
        </div>
        <Link href="/collections" className="text-sm text-muted-foreground hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
