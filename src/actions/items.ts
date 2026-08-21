"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";
import { updateItemSchema } from "@/lib/validations/items";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

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
