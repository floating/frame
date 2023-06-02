import { z } from 'zod'
import { v39KnownTokenSchema } from '../../migrate/migrations/39'

export const KnownTokenSchema = v39KnownTokenSchema
export type KnownToken = z.infer<typeof KnownTokenSchema>
