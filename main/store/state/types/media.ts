import { z } from 'zod'
import { v39MediaSchema } from '../../migrate/migrations/39'

export const MediaSchema = v39MediaSchema
export type Media = z.infer<typeof MediaSchema>
