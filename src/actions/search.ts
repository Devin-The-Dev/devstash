"use server";

import * as z from "zod";
import { searchItems as searchItemsQuery, type SearchableItem } from "@/lib/db/items";
import { runUserAction, type ActionResult } from "@/lib/action-result";

const searchQuerySchema = z.string().max(200);

export async function searchItems(query: unknown): Promise<ActionResult<SearchableItem[]>> {
  return runUserAction("searchItems", async (userId) => {
    const parsed = searchQuerySchema.safeParse(query);
    if (!parsed.success) {
      return { success: false, error: "Invalid search" };
    }

    return { success: true, data: await searchItemsQuery(userId, parsed.data) };
  });
}
