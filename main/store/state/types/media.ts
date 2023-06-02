import { z } from 'zod'

export const MediaSchema = z.object({
  source: z.string(),
  format: z.union([z.literal('image'), z.literal('video'), z.literal('')]),
  cdn: z.object({
    main: z.string().optional(),
    thumb: z.string().optional(),
    frozenThumb: z.string().optional()
  })
})

export type Media = z.infer<typeof MediaSchema>
