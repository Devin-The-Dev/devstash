import { notFound } from "next/navigation";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageThumbnailCard } from "@/components/dashboard/ImageThumbnailCard";
import { FileListItem } from "@/components/dashboard/FileListItem";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { ProUpgradePrompt } from "@/components/items/ProUpgradePrompt";
import { EmptyState } from "@/components/shared/EmptyState";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getItemTypeIcon, ItemTypeIcon } from "@/lib/item-type-icons";
import { formatCount } from "@/lib/format";
import { getCollectionOptions } from "@/lib/db/collections";
import { getItemsByType, getSystemItemTypes, itemTypeSlug } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { ITEMS_PER_PAGE, parsePageParam, totalPagesFor } from "@/lib/pagination";
import { PRO_ITEM_TYPE_NAMES } from "@/lib/plans";

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

  if (!currentUser.isPro) {
    const types = await getSystemItemTypes();
    const proType = types.find(
      (t) => PRO_ITEM_TYPE_NAMES.has(t.name) && itemTypeSlug(t.name) === typeSlug,
    );
    if (proType) return <ProUpgradePrompt type={proType} />;
  }

  const result = await getItemsByType(currentUser.id, typeSlug, page, ITEMS_PER_PAGE);

  if (!result) notFound();

  const { type, items, totalCount } = result;
  const totalPages = totalPagesFor(totalCount, ITEMS_PER_PAGE);
  const isImageType = type.name === "Image";
  const isFileType = type.name === "File";
  const typeLabel = `${type.name.toLowerCase()}s`;

  // Cached: the top bar already loads these for its New item dialog.
  const [itemTypes, collections] =
    totalCount === 0
      ? await Promise.all([getSystemItemTypes(), getCollectionOptions(currentUser.id)])
      : [[], []];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ItemTypeIcon icon={type.icon} className="size-6" style={{ color: type.color }} />
        <div>
          <h1 className="text-2xl font-semibold">{type.name}s</h1>
          <p className="text-muted-foreground">
            {formatCount(totalCount, "item")}
          </p>
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={getItemTypeIcon(type.icon)}
          title={`No ${typeLabel} yet`}
          description={`${type.name}s you add will show up here.`}
          action={
            <NewItemDialog
              variant="cta"
              itemTypes={itemTypes}
              collections={collections.map(({ id, name }) => ({ id, name }))}
              isPro={currentUser.isPro}
              initialTypeId={type.id}
            />
          }
        />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No items on this page.</p>
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
    </div>
  );
}
