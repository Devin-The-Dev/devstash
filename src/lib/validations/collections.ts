import * as z from "zod";

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().nullable().optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema;

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
