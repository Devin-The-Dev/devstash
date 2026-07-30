import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type ItemTypeSummary = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type ItemSummary = {
  id: string;
  title: string;
  description: string | null;
  type: ItemTypeSummary;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date;
  collectionId: string | null;
};

export type DashboardItems = {
  totalItems: number;
  favoriteItems: number;
  pinnedItems: ItemSummary[];
  recentItems: ItemSummary[];
};

// Sidebar order doesn't match DB insertion order reliably, so pin it explicitly.
const SYSTEM_TYPE_ORDER = ["Snippet", "Prompt", "Command", "Note", "Link", "File", "Image"];

export const getSystemItemTypes = cache(async (): Promise<ItemTypeSummary[]> => {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: { id: true, name: true, icon: true, color: true },
  });

  return types.sort(
    (a, b) => SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name),
  );
});

export const getDashboardItems = cache(
  async (userId: string, recentLimit = 10): Promise<DashboardItems> => {
    const items = await prisma.item.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        description: true,
        isFavorite: true,
        isPinned: true,
        lastUsedAt: true,
        updatedAt: true,
        type: { select: { id: true, name: true, icon: true, color: true } },
        tags: { select: { tag: { select: { name: true } } } },
        collections: {
          select: { collectionId: true },
          orderBy: { addedAt: "asc" },
        },
      },
    });

    const summaries: ItemSummary[] = items
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: {
          id: item.type.id,
          name: item.type.name,
          icon: item.type.icon,
          color: item.type.color,
        },
        tags: item.tags.map(({ tag }) => tag.name),
        isFavorite: item.isFavorite,
        isPinned: item.isPinned,
        lastUsedAt: item.lastUsedAt ?? item.updatedAt,
        collectionId: item.collections[0]?.collectionId ?? null,
      }))
      .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());

    return {
      totalItems: summaries.length,
      favoriteItems: summaries.filter((item) => item.isFavorite).length,
      pinnedItems: summaries.filter((item) => item.isPinned),
      recentItems: summaries.slice(0, recentLimit),
    };
  },
);
