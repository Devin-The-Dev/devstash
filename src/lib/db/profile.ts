import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSystemItemTypes, type ItemTypeSummary } from "@/lib/db/items";

export type ItemTypeBreakdown = {
  type: ItemTypeSummary;
  count: number;
};

export type ProfileStats = {
  totalItems: number;
  totalCollections: number;
  breakdown: ItemTypeBreakdown[];
};

export const getProfileStats = cache(async (userId: string): Promise<ProfileStats> => {
  const [systemTypes, typeCounts, totalCollections] = await Promise.all([
    getSystemItemTypes(),
    prisma.item.groupBy({ by: ["typeId"], where: { userId }, _count: true }),
    prisma.collection.count({ where: { userId } }),
  ]);

  const countByTypeId = new Map(typeCounts.map((entry) => [entry.typeId, entry._count]));

  return {
    totalItems: typeCounts.reduce((sum, entry) => sum + entry._count, 0),
    totalCollections,
    breakdown: systemTypes.map((type) => ({
      type,
      count: countByTypeId.get(type.id) ?? 0,
    })),
  };
});
