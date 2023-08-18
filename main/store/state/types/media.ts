import { z } from 'zod'

const v40 = z.object({
  source: z.string(),
  format: z.enum(['image', 'video', '']),
  cdn: z.object({
    main: z.string().optional(),
    thumb: z.string().optional(),
    frozen: z.string().optional()
  })
})

const latest = v40

export { v40, latest }

export type Media = z.infer<typeof MediaSchema>
