"use server";

import { prisma } from "@/lib/prisma";
import { editorPreferencesSchema, type EditorPreferences } from "@/lib/editor-preferences";
import { firstIssue, runUserAction, type ActionResult } from "@/lib/action-result";

export async function updateEditorPreferences(
  input: unknown,
): Promise<ActionResult<EditorPreferences>> {
  return runUserAction("updateEditorPreferences", async (userId) => {
    const parsed = editorPreferencesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { editorPreferences: parsed.data },
    });

    return { success: true, data: parsed.data };
  });
}
