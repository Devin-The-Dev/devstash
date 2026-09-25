"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { editorPreferencesSchema, type EditorPreferences } from "@/lib/editor-preferences";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function updateEditorPreferences(
  input: unknown,
): Promise<ActionResult<EditorPreferences>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: parsed.data },
  });

  return { success: true, data: parsed.data };
}
