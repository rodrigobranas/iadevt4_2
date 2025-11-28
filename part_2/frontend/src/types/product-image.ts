import { z } from 'zod';

export const productImageSchema = z.object({
  id: z.string(),
  productId: z.string(),
  url: z.string(),
  position: z.number(),
  createdAt: z.string(),
});

export const productImagesSchema = z.array(productImageSchema);

export type ProductImage = z.infer<typeof productImageSchema>;
