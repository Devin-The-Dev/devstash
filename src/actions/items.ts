"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getSystemItemTypes,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";
import { createItemSchema, updateItemSchema, CREATABLE_ITEM_TYPES } from "@/lib/validations/items";
import { deleteFromR2, headR2Object, keyFromPublicUrl, readR2ObjectStart } from "@/lib/r2";
import {
  getExtension,
  hasMagicBytes,
  matchesMagicBytes,
  MAGIC_BYTES_LENGTH,
  UPLOAD_CONSTRAINTS,
} from "@/lib/upload-constraints";
import { canCreateItem } from "@/lib/usage-limits";
import { firstIssue, runUserAction, type ActionResult } from "@/lib/action-result";

const ITEM_NOT_FOUND = { success: false, error: "Item not found" } as const;

function findOwnedItem<S extends Prisma.ItemSelect>(userId: string, itemId: string, select: S) {
  return prisma.item.findFirst({ where: { id: itemId, userId }, select });
}

async function assertOwnedCollections(userId: string, collectionIds: string[]): Promise<boolean> {
  if (collectionIds.length === 0) return true;
  const owned = await prisma.collection.findMany({
    where: { id: { in: collectionIds }, userId },
    select: { id: true },
  });
  return owned.length === collectionIds.length;
}

export async function createItem(input: unknown): Promise<ActionResult<ItemDetail>> {
  return runUserAction("createItem", async (userId) => {
    const parsed = createItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const types = await getSystemItemTypes();
    const type = types.find((t) => t.id === parsed.data.typeId);
    if (!type || !CREATABLE_ITEM_TYPES.includes(type.name)) {
      return { success: false, error: "Invalid item type" };
    }

    // Also covers File/Image: a fileUrl can be submitted without going through /api/upload.
    const gate = await canCreateItem(userId, type.name);
    if (!gate.allowed) {
      return { success: false, error: gate.error };
    }

    if (type.name === "Link" && !parsed.data.url) {
      return { success: false, error: "URL is required for link items" };
    }

    const isFileType = type.name === "File" || type.name === "Image";
    if (isFileType && !parsed.data.fileUrl) {
      return { success: false, error: "A file upload is required" };
    }

    // The client-supplied fileUrl must point at an object this user uploaded, and
    // the size is read from R2 rather than trusted from the client.
    let fileSize: number | null = null;
    if (isFileType) {
      const key = keyFromPublicUrl(parsed.data.fileUrl!);
      const constraint = UPLOAD_CONSTRAINTS[type.name === "Image" ? "image" : "file"];
      if (
        !key ||
        !key.startsWith(`${userId}/`) ||
        !constraint.extensions.includes(getExtension(key))
      ) {
        return { success: false, error: "Invalid file" };
      }

      const object = await headR2Object(key);
      if (!object) {
        return { success: false, error: "Uploaded file not found" };
      }
      if (object.contentLength > constraint.maxSize) {
        await deleteFromR2(key);
        return { success: false, error: "File too large" };
      }

      const extension = getExtension(key);
      if (hasMagicBytes(extension)) {
        const start = await readR2ObjectStart(key, MAGIC_BYTES_LENGTH);
        if (!matchesMagicBytes(extension, start)) {
          await deleteFromR2(key);
          return { success: false, error: "File contents don't match its type" };
        }
      }
      fileSize = object.contentLength;
    }

    if (!(await assertOwnedCollections(userId, parsed.data.collectionIds))) {
      return { success: false, error: "Collection not found" };
    }

    const isLink = type.name === "Link";
    const created = await createItemQuery(userId, {
      typeId: type.id,
      collectionIds: parsed.data.collectionIds,
      title: parsed.data.title,
      description: parsed.data.description || null,
      contentType: isFileType ? "FILE" : isLink ? "URL" : "TEXT",
      content: isFileType || isLink ? null : parsed.data.content || null,
      url: isLink ? (parsed.data.url ?? null) : null,
      fileUrl: isFileType ? (parsed.data.fileUrl ?? null) : null,
      fileName: isFileType ? (parsed.data.fileName ?? null) : null,
      fileSize,
      language: parsed.data.language || null,
      tags: parsed.data.tags,
    });

    return { success: true, data: created };
  });
}

/**
 * Flips a boolean flag on an item the user owns. Favorite and pinned state
 * show up in the sidebar, dashboard, /favorites, card indicators and listing
 * order, so the whole app shell is refreshed in the action's response.
 */
async function toggleItemFlag<F extends "isFavorite" | "isPinned">(
  name: string,
  itemId: string,
  field: F,
): Promise<ActionResult<Record<F, boolean>>> {
  return runUserAction(name, async (userId) => {
    const select = { [field]: true } as Record<F, true>;
    const item = (await findOwnedItem(userId, itemId, select)) as Record<F, boolean> | null;
    if (!item) {
      return ITEM_NOT_FOUND;
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: { [field]: !item[field] },
      select,
    });

    revalidatePath("/", "layout");

    return { success: true, data: updated as unknown as Record<F, boolean> };
  });
}

export async function toggleItemFavorite(
  itemId: string,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  return toggleItemFlag("toggleItemFavorite", itemId, "isFavorite");
}

export async function toggleItemPinned(
  itemId: string,
): Promise<ActionResult<{ isPinned: boolean }>> {
  return toggleItemFlag("toggleItemPinned", itemId, "isPinned");
}

export async function updateItem(
  itemId: string,
  input: unknown,
): Promise<ActionResult<ItemDetail>> {
  return runUserAction("updateItem", async (userId) => {
    const parsed = updateItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    if (!(await findOwnedItem(userId, itemId, { id: true }))) {
      return ITEM_NOT_FOUND;
    }

    if (!(await assertOwnedCollections(userId, parsed.data.collectionIds))) {
      return { success: false, error: "Collection not found" };
    }

    const updated = await updateItemQuery(userId, itemId, parsed.data);

    return { success: true, data: updated };
  });
}

export async function deleteItem(itemId: string): Promise<ActionResult<{ id: string }>> {
  return runUserAction("deleteItem", async (userId) => {
    if (!(await findOwnedItem(userId, itemId, { id: true }))) {
      return ITEM_NOT_FOUND;
    }

    const deleted = await deleteItemQuery(userId, itemId);

    // The item is already gone, so an R2 failure is logged rather than
    // reported back as a failed delete.
    if (deleted.fileUrl) {
      try {
        const key = keyFromPublicUrl(deleted.fileUrl);
        if (key) {
          await deleteFromR2(key);
        } else {
          console.error("Item fileUrl isn't in the R2 bucket; object not deleted", deleted.fileUrl);
        }
      } catch (error) {
        console.error("Failed to delete R2 object for", deleted.fileUrl, error);
      }
    }

    return { success: true, data: { id: itemId } };
  });
}
