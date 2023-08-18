import { z } from 'zod'

const PermissionSchema = z.object({
  origin: z.string(),
  provider: z.boolean().default(false).describe('Whether or not to grant access to this origin'),
  handlerId: z.string()
})

const v37 = z.record(
  z.string().describe('Address'),
  z.record(z.string().describe('Origin Id')),
  PermissionSchema
)

const latest = v37.catch({}).default({})

export { v37, latest }
export type Permission = z.infer<typeof PermissionSchema>
