import { z } from 'zod'

const ColorSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number()
})

export const ColorwayPaletteSchema = z.object({
  accent1: ColorSchema,
  accent2: ColorSchema,
  accent3: ColorSchema,
  accent4: ColorSchema,
  accent5: ColorSchema,
  accent6: ColorSchema,
  accent7: ColorSchema,
  accent8: ColorSchema
})

export type ColorwayPalette = z.infer<typeof ColorwayPaletteSchema>
