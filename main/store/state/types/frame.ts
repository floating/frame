import { z } from 'zod'

export const ViewSchema = z.object({
  id: z.string(),
  // ready: z.boolean(),
  dappId: z.string(),
  ens: z.string(),
  url: z.string()
})

export const FrameSchema = z.object({
  id: z.string(),
  currentView: z.string(),
  views: z.record(z.string(), ViewSchema)
})

export type ViewMetadata = z.infer<typeof ViewSchema>
export type Frame = z.infer<typeof FrameSchema>
