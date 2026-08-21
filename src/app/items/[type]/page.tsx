import { notFound } from "next/navigation";
import { Box } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { getItemsByType } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: typeSlug } = await params;
  const currentUser = await getCurrentUser();
  const result = await getItemsByType(currentUser.id, typeSlug);

  if (!result) notFound();

  const { type, items } = result;
  const Icon = itemTypeIconMap[type.icon] ?? Box;

  return (
    <main className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon className="size-6" style={{ color: type.color }} />
        <div>
          <h1 className="text-2xl font-semibold">{type.name}s</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No {type.name.toLowerCase()}s yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
