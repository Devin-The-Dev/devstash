"use client";

import { Box } from "lucide-react";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { useDrawerRowProps } from "@/hooks/use-drawer-row";
import type { FavoriteItem } from "@/lib/db/items";
import { FavoriteRowContent, favoriteRowClassName } from "./FavoriteRow";

// `date` is pre-formatted on the server so the client doesn't re-render it in
// a different timezone and trip a hydration mismatch.
export function FavoriteItemRow({ item, date }: { item: FavoriteItem; date: string }) {
  const Icon = itemTypeIconMap[item.type.icon] ?? Box;
  const drawerRowProps = useDrawerRowProps(item.id);

  return (
    <div className={favoriteRowClassName} {...drawerRowProps}>
      <FavoriteRowContent
        icon={Icon}
        color={item.type.color}
        title={item.title}
        typeLabel={item.type.name}
        date={date}
      />
    </div>
  );
}
