import { z } from "zod";

export const productInputSchema = z.object({
  productName: z.string().trim().min(2).optional(),
  imageBase64: z.string().min(1).optional(),
  imageMimeType: z.string().min(1).optional(),
});

export const identifiedProductSchema = z.object({
  name: z.string(),
  brand: z.string().nullable(),
  category: z.string(),
  description: z.string(),
  materialsOrIngredients: z.array(z.string()),
  packagingType: z.string().nullable(),
  likelyUseCase: z.string(),
  confidence: z.number().min(0).max(1),
  identificationNotes: z.array(z.string()),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type IdentifiedProduct = z.infer<typeof identifiedProductSchema>;
