"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getSystemItemTypes,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";
import { createItemSchema, updateItemSchema, CREATABLE_ITEM_TYPES } from "@/lib/validations/items";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createItem(input: unknown): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const types = await getSystemItemTypes();
  const type = types.find((t) => t.id === parsed.data.typeId);
  if (!type || !CREATABLE_ITEM_TYPES.includes(type.name)) {
    return { success: false, error: "Invalid item type" };
  }

  if (type.name === "Link" && !parsed.data.url) {
    return { success: false, error: "URL is required for link items" };
  }

  if (parsed.data.collectionId) {
    const collection = await prisma.collection.findFirst({
      where: { id: parsed.data.collectionId, userId: session.user.id },
      select: { id: true },
    });
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
  }

  const isLink = type.name === "Link";
  const created = await createItemQuery(session.user.id, {
    typeId: type.id,
    collectionId: parsed.data.collectionId ?? null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    contentType: isLink ? "URL" : "TEXT",
    content: isLink ? null : parsed.data.content || null,
    url: isLink ? (parsed.data.url ?? null) : null,
    language: parsed.data.language || null,
    tags: parsed.data.tags,
  });

  return { success: true, data: created };
}

export async function toggleItemFavorite(
  itemId: string,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
    select: { isFavorite: true },
  });
  if (!item) {
    return { success: false, error: "Item not found" };
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { isFavorite: !item.isFavorite },
    select: { isFavorite: true },
  });

  return { success: true, data: updated };
}

export async function toggleItemPinned(
  itemId: string,
): Promise<ActionResult<{ isPinned: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
    select: { isPinned: true },
  });
  if (!item) {
    return { success: false, error: "Item not found" };
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { isPinned: !item.isPinned },
    select: { isPinned: true },
  });

  return { success: true, data: updated };
}

export async function updateItem(
  itemId: string,
  input: unknown,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Item not found" };
  }

  const updated = await updateItemQuery(session.user.id, itemId, parsed.data);

  return { success: true, data: updated };
}

export async function deleteItem(itemId: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
    select: { id: true },
  });
  if (!item) {
    return { success: false, error: "Item not found" };
  }

  await deleteItemQuery(session.user.id, itemId);

  return { success: true, data: { id: itemId } };
}
