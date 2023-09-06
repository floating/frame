import { z } from 'zod'

const ViewSchema = z.object({
  id: z.string(),
  // ready: z.boolean(),
  dappId: z.string(),
  ens: z.string(),
  url: z.string()
})

const FrameSchema = z.object({
  id: z.string(),
  currentView: z.string(),
  views: z.record(z.string(), ViewSchema)
})

const v37 = z.record(FrameSchema)

const latest = v37.catch({}).default({})

export { v37, latest }

export type ViewMetadata = z.infer<typeof ViewSchema>
export type Frame = z.infer<typeof FrameSchema>
