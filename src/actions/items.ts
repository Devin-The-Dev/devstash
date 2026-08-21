"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
