import { ItemCard } from "@/components/dashboard/ItemCard";
import type { ItemSummary } from "@/lib/db/items";

export function PinnedItemsSection({ items }: { items: ItemSummary[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Pinned</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
