"use server";

import * as z from "zod";
import { auth } from "@/auth";
import { searchItems as searchItemsQuery, type SearchableItem } from "@/lib/db/items";
import { runAction, type ActionResult } from "@/lib/action-result";

const searchQuerySchema = z.string().max(200);

export async function searchItems(query: unknown): Promise<ActionResult<SearchableItem[]>> {
  return runAction("searchItems", async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = searchQuerySchema.safeParse(query);
    if (!parsed.success) {
      return { success: false, error: "Invalid search" };
    }

    return { success: true, data: await searchItemsQuery(session.user.id, parsed.data) };
  });
}
