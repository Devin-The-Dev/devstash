import { notFound } from "next/navigation";
import { Box } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageThumbnailCard } from "@/components/dashboard/ImageThumbnailCard";
import { FileListItem } from "@/components/dashboard/FileListItem";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { getItemsByType } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { ITEMS_PER_PAGE, parsePageParam, totalPagesFor } from "@/lib/pagination";

export default async function ItemsByTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { type: typeSlug } = await params;
  const page = parsePageParam((await searchParams).page);
  const currentUser = await getCurrentUser();
  const result = await getItemsByType(currentUser.id, typeSlug, page, ITEMS_PER_PAGE);

  if (!result) notFound();

  const { type, items, totalCount } = result;
  const totalPages = totalPagesFor(totalCount, ITEMS_PER_PAGE);
  const Icon = itemTypeIconMap[type.icon] ?? Box;
  const isImageType = type.name === "Image";
  const isFileType = type.name === "File";

  return (
    <main className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon className="size-6" style={{ color: type.color }} />
        <div>
          <h1 className="text-2xl font-semibold">{type.name}s</h1>
          <p className="text-muted-foreground">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          {totalCount === 0 ? `No ${type.name.toLowerCase()}s yet.` : "No items on this page."}
        </p>
      ) : isFileType ? (
        <div className="rounded-lg border">
          {items.map((item) => (
            <FileListItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) =>
            isImageType ? (
              <ImageThumbnailCard key={item.id} item={item} />
            ) : (
              <ItemCard key={item.id} item={item} />
            ),
          )}
        </div>
      )}

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        basePath={`/items/${typeSlug}`}
      />
    </main>
  );
}
