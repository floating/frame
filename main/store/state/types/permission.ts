import { z } from 'zod'

export const PermissionSchema = z.object({
  origin: z.string(),
  provider: z.boolean().default(false).describe('Whether or not to grant access to this origin'),
  handlerId: z.string()
})

export type Permission = z.infer<typeof PermissionSchema>
