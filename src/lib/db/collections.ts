import { cache } from "react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getVisibleItemsFilter } from "@/lib/db/item-visibility";
import { PRO_ITEM_TYPE_NAMES } from "@/lib/plans";

export type CollectionItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type CollectionOption = {
  id: string;
  name: string;
};

export type NewCollectionInput = {
  name: string;
  description: string | null;
};

export type CollectionRecord = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
};

export async function createCollection(
  userId: string,
  data: NewCollectionInput,
): Promise<CollectionRecord> {
  return prisma.collection.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
    },
  });
}

export async function updateCollection(
  userId: string,
  id: string,
  data: NewCollectionInput,
): Promise<CollectionRecord | null> {
  const { count } = await prisma.collection.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      description: data.description,
    },
  });
  if (count === 0) return null;

  return prisma.collection.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
    },
  });
}

export async function toggleCollectionFavorite(
  userId: string,
  id: string,
): Promise<{ isFavorite: boolean } | null> {
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
    select: { isFavorite: true },
  });
  if (!collection) return null;

  return prisma.collection.update({
    where: { id, userId },
    data: { isFavorite: !collection.isFavorite },
    select: { isFavorite: true },
  });
}

export async function deleteCollection(userId: string, id: string): Promise<boolean> {
  // ItemCollection rows cascade-delete with the collection; Item rows are untouched.
  const { count } = await prisma.collection.deleteMany({ where: { id, userId } });
  return count > 0;
}

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

// Takes the visibility filter so hidden (Pro-only) items don't count toward a
// collection's item total, type icons or last-used time.
const collectionWithItemsSelect = (visible: Prisma.ItemWhereInput) => ({
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  updatedAt: true,
  items: {
    where: { item: visible },
    select: {
      item: {
        select: {
          typeId: true,
          lastUsedAt: true,
          updatedAt: true,
          type: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      },
    },
  },
}) as const;

type CollectionWithItemsRow = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  items: {
    item: {
      typeId: string;
      lastUsedAt: Date | null;
      updatedAt: Date;
      type: CollectionItemType;
    };
  }[];
};

function toCollectionSummary(collection: CollectionWithItemsRow): CollectionSummary {
  const typeCounts = new Map<string, { type: CollectionItemType; count: number }>();
  let lastUsedAt = collection.updatedAt;

  for (const { item } of collection.items) {
    const entry = typeCounts.get(item.typeId);
    if (entry) {
      entry.count += 1;
    } else {
      typeCounts.set(item.typeId, { type: item.type, count: 1 });
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
}

export type CollectionOptionWithCount = CollectionOption & { itemCount: number };

// Lean list for the shell: the item drawer, New item dialog and command
// palette only need names and counts, not every item row.
export const getCollectionOptions = cache(
  async (userId: string): Promise<CollectionOptionWithCount[]> => {
    const rows = await prisma.collection.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        _count: { select: { items: { where: { item: await getVisibleItemsFilter(userId) } } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(({ _count, ...collection }) => ({ ...collection, itemCount: _count.items }));
  },
);

const SIDEBAR_RECENT_LIMIT = 4;

export type SidebarCollections = {
  favorites: CollectionOption[];
  recent: CollectionSummary[];
};

// The sidebar shows every favorite by name and the few most recently active
// other collections. "Recently active" is the latest of the collection's own
// updatedAt and its visible items' last use, ranked in SQL so only the top
// few collections' items are loaded.
export const getSidebarCollections = cache(async (userId: string): Promise<SidebarCollections> => {
  const visible = await getVisibleItemsFilter(userId);
  const hideProTypes = Object.keys(visible).length > 0;
  const visibleItemJoin = hideProTypes
    ? Prisma.sql`AND i."typeId" NOT IN (SELECT id FROM "ItemType" WHERE name IN (${Prisma.join([...PRO_ITEM_TYPE_NAMES])}))`
    : Prisma.empty;

  const [favorites, recentIds] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.$queryRaw<{ id: string }[]>`
      SELECT c.id
      FROM "Collection" c
      LEFT JOIN "ItemCollection" ic ON ic."collectionId" = c.id
      LEFT JOIN "Item" i ON i.id = ic."itemId" ${visibleItemJoin}
      WHERE c."userId" = ${userId} AND c."isFavorite" = false
      GROUP BY c.id
      ORDER BY GREATEST(c."updatedAt", MAX(COALESCE(i."lastUsedAt", i."updatedAt"))) DESC
      LIMIT ${SIDEBAR_RECENT_LIMIT}
    `,
  ]);

  const ids = recentIds.map(({ id }) => id);
  const rows = await prisma.collection.findMany({
    where: { id: { in: ids } },
    select: collectionWithItemsSelect(visible),
  });
  const byId = new Map(rows.map((row) => [row.id, toCollectionSummary(row)]));

  return {
    favorites,
    recent: ids.map((id) => byId.get(id)).filter((c): c is CollectionSummary => c !== undefined),
  };
});

export type CollectionsPage = {
  collections: CollectionSummary[];
  totalCount: number;
};

// Paginated variant for /collections and the dashboard's limited "top N"
// section. Sorts by the collection's own `updatedAt` (a real, indexable
// column) rather than true last-item activity, since computing that here
// would mean fetching every collection's full item list just to determine
// page order — exactly what pagination is meant to avoid. The sidebar's
// getSidebarCollections ranks by true activity in SQL instead.
export const getCollectionsPage = cache(
  async (userId: string, page: number, pageSize: number): Promise<CollectionsPage> => {
    const where = { userId };
    const [rows, totalCount] = await Promise.all([
      prisma.collection.findMany({
        where,
        select: collectionWithItemsSelect(await getVisibleItemsFilter(userId)),
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.collection.count({ where }),
    ]);

    return { collections: rows.map(toCollectionSummary), totalCount };
  },
);

export type FavoriteCollection = {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: Date;
};

// See getFavoriteItems: updatedAt is the closest proxy for favorited-at.
export const getFavoriteCollections = cache(
  async (userId: string): Promise<FavoriteCollection[]> => {
    const rows = await prisma.collection.findMany({
      where: { userId, isFavorite: true },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        _count: { select: { items: { where: { item: await getVisibleItemsFilter(userId) } } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(({ _count, ...collection }) => ({ ...collection, itemCount: _count.items }));
  },
);

export const getFavoriteCollectionsCount = cache(async (userId: string): Promise<number> => {
  return prisma.collection.count({ where: { userId, isFavorite: true } });
});
