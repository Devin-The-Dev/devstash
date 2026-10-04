import * as z from "zod";

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name can be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description can be at most 1000 characters")
    .nullable()
    .optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema;

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
