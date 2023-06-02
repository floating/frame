import { z } from 'zod'
import { v39CustomTokenSchema } from '../../migrate/migrations/39'

export const CustomTokenSchema = v39CustomTokenSchema
export type CustomToken = z.infer<typeof CustomTokenSchema>
