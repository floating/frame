import { z } from 'zod'
import { AddressSchema } from '../types/common'
import { schemaWithEmptyDefaults } from './util'

const selected = z
  .object({
    minimized: z.boolean().default(true),
    open: z.boolean().default(false),
    showAccounts: z.boolean().default(false),
    current: z.union([z.literal(''), AddressSchema]).default(''),
    view: z.enum(['default', 'settings']).default('default'),
    position: z
      .object({
        scrollTop: z.number().default(0),
        initial: z
          .object({
            top: z.number().default(5),
            left: z.number().default(5),
            right: z.number().default(5),
            bottom: z.number().default(5),
            height: z.number().default(5),
            index: z.number().default(0)
          })
          .default({})
      })
      .default({})
  })
  .passthrough()

export default schemaWithEmptyDefaults(selected)
