import { z } from 'zod'

export const schemaWithEmptyDefaults = <T extends z.ZodType<any>>(schema: T, def: any = {}) =>
  schema.catch(() => schema.parse(def)).default(def)
