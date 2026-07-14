import { prisma } from "@/lib/prisma";

// No auth is wired up yet, so all dashboard data is scoped to the seeded demo user.
const DEMO_USER_ID = "demo-user";

export type CollectionItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type CollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  lastUsedAt: Date;
  types: CollectionItemType[];
  dominantColor: string | null;
};

export async function getCollectionsWithStats(): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId: DEMO_USER_ID },
    include: {
      items: {
        include: {
          item: {
            include: { type: true },
          },
        },
      },
    },
  });

  return collections
    .map((collection) => {
      const typeCounts = new Map<string, { type: CollectionItemType; count: number }>();
      let lastUsedAt = collection.updatedAt;

      for (const { item } of collection.items) {
        const entry = typeCounts.get(item.typeId);
        if (entry) {
          entry.count += 1;
        } else {
          typeCounts.set(item.typeId, {
            type: {
              id: item.type.id,
              name: item.type.name,
              icon: item.type.icon,
              color: item.type.color,
            },
            count: 1,
          });
        }

        const itemLastUsed = item.lastUsedAt ?? item.updatedAt;
        if (itemLastUsed > lastUsedAt) lastUsedAt = itemLastUsed;
      }

      const rankedTypes = [...typeCounts.values()].sort((a, b) => b.count - a.count);

      return {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite,
        itemCount: collection.items.length,
        lastUsedAt,
        types: rankedTypes.map((entry) => entry.type),
        dominantColor: rankedTypes[0]?.type.color ?? null,
      };
    })
    .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
}
