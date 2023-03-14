import { z } from 'zod'

const ColorSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number()
})

export const ColorwayPrimarySchema = z.object({
  dark: z.object({
    background: z.literal('rgb(26, 22, 28)'),
    text: z.literal('rgb(241, 241, 255)')
  }),
  light: z.object({
    background: z.literal('rgb(240, 230, 243)'),
    text: z.literal('rgb(20, 40, 60)')
  })
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
