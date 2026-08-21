import * as z from "zod";

export const CREATABLE_ITEM_TYPES: string[] = ["Snippet", "Prompt", "Command", "Note", "Link"];

export const createItemSchema = z.object({
  typeId: z.string().min(1, "Type is required"),
  collectionId: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.union([z.url(), z.null()]).optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.union([z.url(), z.null()]).optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
