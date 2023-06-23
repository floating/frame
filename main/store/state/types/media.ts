import { z } from 'zod'
import { v40MediaSchema } from '../../migrate/migrations/40'

export const MediaSchema = v40MediaSchema
export type Media = z.infer<typeof MediaSchema>
