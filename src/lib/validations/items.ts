import * as z from "zod";

export const CREATABLE_ITEM_TYPES: string[] = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "Link",
  "File",
  "Image",
];

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 2000;
export const CONTENT_MAX = 100_000;
export const TAG_MAX = 40;
export const TAGS_MAX = 20;

// Lowercased and de-duplicated: a repeated tag would violate ItemTag's
// composite primary key.
const tagsSchema = z
  .array(z.string().trim().min(1).max(TAG_MAX, `Tags can be at most ${TAG_MAX} characters`))
  .max(TAGS_MAX, `At most ${TAGS_MAX} tags`)
  .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))]);

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(TITLE_MAX, `Title can be at most ${TITLE_MAX} characters`);
const descriptionSchema = z
  .string()
  .max(DESCRIPTION_MAX, `Description can be at most ${DESCRIPTION_MAX} characters`)
  .nullable()
  .optional();
const contentSchema = z.string().max(CONTENT_MAX, "Content is too long").nullable().optional();
const languageSchema = z.string().max(50).nullable().optional();

export const createItemSchema = z.object({
  typeId: z.string().min(1, "Type is required"),
  collectionIds: z.array(z.string()).default([]),
  title: titleSchema,
  description: descriptionSchema,
  content: contentSchema,
  url: z.union([z.url().max(2048), z.null()]).optional(),
  fileUrl: z.union([z.url(), z.null()]).optional(),
  fileName: z.string().max(255).nullable().optional(),
  // Ignored by createItem, which reads the real size from R2.
  fileSize: z.number().nullable().optional(),
  language: languageSchema,
  tags: tagsSchema,
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  content: contentSchema,
  url: z.union([z.url().max(2048), z.null()]).optional(),
  language: languageSchema,
  tags: tagsSchema,
  collectionIds: z.array(z.string()),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
