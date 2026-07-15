import { prisma } from "@/lib/prisma";

// No auth is wired up yet, so all dashboard data is scoped to the seeded demo user.
const DEMO_USER_ID = "demo-user";

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

export async function getSystemItemTypes(): Promise<ItemTypeSummary[]> {
  const types = await prisma.itemType.findMany({ where: { isSystem: true } });

  return types
    .map((type) => ({
      id: type.id,
      name: type.name,
      icon: type.icon,
      color: type.color,
    }))
    .sort((a, b) => SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name));
}

export async function getDashboardItems(recentLimit = 10): Promise<DashboardItems> {
  const items = await prisma.item.findMany({
    where: { userId: DEMO_USER_ID },
    include: {
      type: true,
      tags: { include: { tag: true } },
      collections: true,
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
}
