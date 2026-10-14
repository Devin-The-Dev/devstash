"use server";

import { revalidatePath } from "next/cache";
import {
  deleteCollection,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
  updateCollection,
  type CollectionRecord,
} from "@/lib/db/collections";
import { updateCollectionSchema } from "@/lib/validations/collections";
import { firstIssue, runUserAction, type ActionResult } from "@/lib/action-result";

function revalidateCollection(collectionId: string) {
  revalidatePath("/collections");
  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");
}

export async function updateCollectionAction(
  collectionId: string,
  input: { name: string; description: string | null },
): Promise<ActionResult<CollectionRecord>> {
  return runUserAction("updateCollectionAction", async (userId) => {
    const parsed = updateCollectionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    const updated = await updateCollection(userId, collectionId, {
      name: parsed.data.name,
      description: parsed.data.description || null,
    });
    if (!updated) {
      return { success: false, error: "Collection not found" };
    }

    revalidateCollection(collectionId);

    return { success: true, data: updated };
  });
}

export async function deleteCollectionAction(
  collectionId: string,
): Promise<ActionResult<null>> {
  return runUserAction("deleteCollectionAction", async (userId) => {
    const deleted = await deleteCollection(userId, collectionId);
    if (!deleted) {
      return { success: false, error: "Collection not found" };
    }

    revalidateCollection(collectionId);

    return { success: true, data: null };
  });
}

export async function toggleCollectionFavorite(
  collectionId: string,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  return runUserAction("toggleCollectionFavorite", async (userId) => {
    const updated = await toggleCollectionFavoriteQuery(userId, collectionId);
    if (!updated) {
      return { success: false, error: "Collection not found" };
    }

    // Same reasoning as toggleItemFavorite: favorites surface across the whole shell.
    revalidatePath("/", "layout");

    return { success: true, data: updated };
  });
}
