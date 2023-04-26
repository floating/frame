import { z } from 'zod'

export const FrameSchema = z.any()

export type Frame = z.infer<typeof FrameSchema>
