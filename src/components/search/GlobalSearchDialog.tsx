"use client";

import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { getItemTypeIcon } from "@/lib/item-type-icons";
import type { SearchableItem } from "@/lib/db/items";
import type { SearchableCollection } from "@/components/search/CommandPaletteProvider";

// cmdk's default filter does fuzzy subsequence matching (same algorithm as VS
// Code's quick-open). Against short command labels that's a nice touch of
// typo-tolerance, but our keywords include full-sentence descriptions, so a
// short query like "test" is a subsequence of almost any sentence and matches
// nearly every item. Use a plain case-insensitive substring match instead.
function substringFilter(_value: string, search: string, keywords: string[] = []): number {
  const query = search.trim().toLowerCase();
  if (!query) return 1;
  return keywords.some((keyword) => keyword.toLowerCase().includes(query)) ? 1 : 0;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  items,
  collections,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SearchableItem[];
  collections: SearchableCollection[];
}) {
  const router = useRouter();
  const { openItem } = useItemDrawer();

  function handleSelectItem(itemId: string) {
    onOpenChange(false);
    openItem(itemId);
  }

  function handleSelectCollection(collectionId: string) {
    onOpenChange(false);
    router.push(`/collections/${collectionId}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search items and collections"
      filter={substringFilter}
    >
      <CommandInput placeholder="Search items, collections..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {items.length > 0 && (
          <CommandGroup heading="Items">
            {items.map((item) => {
              const Icon = getItemTypeIcon(item.type.icon);
              return (
                <CommandItem
                  key={item.id}
                  value={`item:${item.id}`}
                  keywords={[item.title, item.description ?? "", item.type.name]}
                  onSelect={() => handleSelectItem(item.id)}
                >
                  <Icon className="size-4 shrink-0" style={{ color: item.type.color }} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{item.title}</span>
                    {item.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {collections.length > 0 && (
          <CommandGroup heading="Collections">
            {collections.map((collection) => (
              <CommandItem
                key={collection.id}
                value={`collection:${collection.id}`}
                keywords={[collection.name]}
                onSelect={() => handleSelectCollection(collection.id)}
              >
                <Folder className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{collection.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
