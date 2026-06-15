import Link from "next/link";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import type { Collection } from "@/lib/mock-data";

export function CollectionsSection({ collections }: { collections: Collection[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Collections</h2>
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
