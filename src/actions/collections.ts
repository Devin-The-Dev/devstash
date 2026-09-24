"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  deleteCollection,
  updateCollection,
  type CollectionRecord,
} from "@/lib/db/collections";
import { updateCollectionSchema } from "@/lib/validations/collections";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function updateCollectionAction(
  collectionId: string,
  input: { name: string; description: string | null },
): Promise<ActionResult<CollectionRecord>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const updated = await updateCollection(session.user.id, collectionId, {
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (!updated) {
    return { success: false, error: "Collection not found" };
  }

  revalidatePath("/collections");
  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");

  return { success: true, data: updated };
}

export async function deleteCollectionAction(
  collectionId: string,
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const deleted = await deleteCollection(session.user.id, collectionId);
  if (!deleted) {
    return { success: false, error: "Collection not found" };
  }

  revalidatePath("/collections");
  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");

  return { success: true, data: null };
}
