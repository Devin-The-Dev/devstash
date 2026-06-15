import Link from "next/link";
import { ItemCard } from "@/components/dashboard/ItemCard";
import type { Item } from "@/lib/mock-data";

export function RecentItemsSection({ items }: { items: Item[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recently used</h2>
        <Link href="/recent" className="text-sm text-muted-foreground hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
