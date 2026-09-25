import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { UpdateItemInput } from "@/lib/validations/items";

export type NewItemInput = {
  typeId: string;
  collectionIds: string[];
  title: string;
  description: string | null;
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  tags: string[];
};

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
  createdAt: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
};

export type ItemDetail = {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  type: ItemTypeSummary;
  tags: string[];
  collections: { id: string; name: string }[];
};

export type SearchableItem = {
  id: string;
  title: string;
  description: string | null;
  type: ItemTypeSummary;
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

export function itemTypeSlug(name: string): string {
  return `${name.toLowerCase()}s`;
}

type RawItemRow = {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: { tag: { name: string } }[];
};

function toItemSummary(item: RawItemRow, type: ItemTypeSummary): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type,
    tags: item.tags.map(({ tag }) => tag.name),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    lastUsedAt: item.lastUsedAt ?? item.updatedAt,
    createdAt: item.createdAt,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
  };
}

// Nulls sort last: an item without an explicit lastUsedAt (shouldn't happen
// for anything created after createItem started stamping it, but kept as a
// defensive default for older/edge-case rows) falls to the back rather than
// jumping to the front the way Postgres's DESC-sorts-nulls-first default would.
const LAST_USED_ORDER = { lastUsedAt: { sort: "desc", nulls: "last" } } as const;

const ITEM_SUMMARY_SELECT = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  tags: { select: { tag: { select: { name: true } } } },
} as const;

const ITEM_SUMMARY_WITH_TYPE_SELECT = {
  ...ITEM_SUMMARY_SELECT,
  type: { select: { id: true, name: true, icon: true, color: true } },
} as const;

export const getItemsByType = cache(
  async (
    userId: string,
    typeSlug: string,
    page: number,
    pageSize: number,
  ): Promise<{ type: ItemTypeSummary; items: ItemSummary[]; totalCount: number } | null> => {
    const types = await getSystemItemTypes();
    const type = types.find((t) => itemTypeSlug(t.name) === typeSlug);
    if (!type) return null;

    const where = { userId, typeId: type.id };
    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        where,
        select: ITEM_SUMMARY_SELECT,
        orderBy: LAST_USED_ORDER,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.item.count({ where }),
    ]);

    return { type, items: items.map((item) => toItemSummary(item, type)), totalCount };
  },
);

export const getItemsByCollection = cache(
  async (
    userId: string,
    collectionId: string,
    page: number,
    pageSize: number,
  ): Promise<{
    collection: { id: string; name: string; description: string | null; isFavorite: boolean };
    items: ItemSummary[];
    totalCount: number;
  } | null> => {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { id: true, name: true, description: true, isFavorite: true },
    });
    if (!collection) return null;

    const where = { userId, collections: { some: { collectionId } } };
    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        where,
        select: ITEM_SUMMARY_WITH_TYPE_SELECT,
        orderBy: LAST_USED_ORDER,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.item.count({ where }),
    ]);

    return {
      collection,
      items: items.map((item) => toItemSummary(item, item.type)),
      totalCount,
    };
  },
);

const ITEM_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  url: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
  type: { select: { id: true, name: true, icon: true, color: true } },
  tags: { select: { tag: { select: { name: true } } } },
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { addedAt: "asc" },
  },
} as const;

function toItemDetail(item: {
  tags: { tag: { name: string } }[];
  collections: { collection: { id: string; name: string } }[];
  [key: string]: unknown;
}): ItemDetail {
  return {
    ...item,
    tags: item.tags.map(({ tag }) => tag.name),
    collections: item.collections.map(({ collection }) => collection),
  } as ItemDetail;
}

export async function getItemDetail(
  userId: string,
  itemId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: ITEM_DETAIL_SELECT,
  });

  if (!item) return null;

  return toItemDetail(item);
}

export async function createItem(userId: string, data: NewItemInput): Promise<ItemDetail> {
  const item = await prisma.item.create({
    data: {
      userId,
      typeId: data.typeId,
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      content: data.content,
      url: data.url,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      language: data.language,
      // Stamped at creation so a brand-new item sorts as "just used" rather
      // than falling to the back of lastUsedAt-ordered lists until something
      // explicitly marks it used.
      lastUsedAt: new Date(),
      tags: {
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name_userId: { name, userId } },
              create: { name, userId },
            },
          },
        })),
      },
      collections:
        data.collectionIds.length > 0
          ? { create: data.collectionIds.map((collectionId) => ({ collectionId })) }
          : undefined,
    },
    select: ITEM_DETAIL_SELECT,
  });

  return toItemDetail(item);
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemInput,
): Promise<ItemDetail> {
  const item = await prisma.item.update({
    where: { id: itemId, userId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        deleteMany: {},
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name_userId: { name, userId } },
              create: { name, userId },
            },
          },
        })),
      },
      collections: {
        deleteMany: {},
        create: data.collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    select: ITEM_DETAIL_SELECT,
  });

  return toItemDetail(item);
}

export async function deleteItem(
  userId: string,
  itemId: string,
): Promise<{ fileUrl: string | null }> {
  return prisma.item.delete({
    where: { id: itemId, userId },
    select: { fileUrl: true },
  });
}

// Lean projection for the command palette: no tags/favorite/pin state needed,
// just enough to render a result row and jump to the item drawer.
export const getSearchableItems = cache(async (userId: string): Promise<SearchableItem[]> => {
  return prisma.item.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
      type: { select: { id: true, name: true, icon: true, color: true } },
    },
    orderBy: { title: "asc" },
  });
});

export type FavoriteItem = {
  id: string;
  title: string;
  type: ItemTypeSummary;
  updatedAt: Date;
};

// No dedicated favoritedAt column exists, so updatedAt stands in for
// "most recently favorited" (it also moves on any other edit).
export const getFavoriteItems = cache(async (userId: string): Promise<FavoriteItem[]> => {
  return prisma.item.findMany({
    where: { userId, isFavorite: true },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      type: { select: { id: true, name: true, icon: true, color: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
});

export const getDashboardItems = cache(
  async (userId: string, recentLimit: number): Promise<DashboardItems> => {
    const [totalItems, favoriteItems, pinnedRows, recentRows] = await Promise.all([
      prisma.item.count({ where: { userId } }),
      prisma.item.count({ where: { userId, isFavorite: true } }),
      prisma.item.findMany({
        where: { userId, isPinned: true },
        select: ITEM_SUMMARY_WITH_TYPE_SELECT,
        orderBy: LAST_USED_ORDER,
      }),
      prisma.item.findMany({
        where: { userId },
        select: ITEM_SUMMARY_WITH_TYPE_SELECT,
        orderBy: LAST_USED_ORDER,
        take: recentLimit,
      }),
    ]);

    return {
      totalItems,
      favoriteItems,
      pinnedItems: pinnedRows.map((item) => toItemSummary(item, item.type)),
      recentItems: recentRows.map((item) => toItemSummary(item, item.type)),
    };
  },
);
