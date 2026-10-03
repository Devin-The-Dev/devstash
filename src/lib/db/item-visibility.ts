import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { PRO_ITEM_TYPE_NAMES } from "@/lib/plans";
import { getUserIsPro } from "@/lib/usage-limits";

const PRO_TYPES_HIDDEN: Prisma.ItemWhereInput = {
  type: { name: { notIn: [...PRO_ITEM_TYPE_NAMES] } },
};

// Free users can't access Pro-only item types (File, Image), so any they own
// (seeded data, or left over from a lapsed subscription) are hidden from every
// listing, count, search and detail lookup. Merge into an item `where` clause.
export const getVisibleItemsFilter = cache(
  async (userId: string): Promise<Prisma.ItemWhereInput> =>
    (await getUserIsPro(userId)) ? {} : PRO_TYPES_HIDDEN,
);
