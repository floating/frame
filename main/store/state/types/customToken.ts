import { z } from 'zod'
import { MediaSchema } from './media'

export const CustomTokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  chainId: z.number(),
  address: z.string(), //TODO: could/should we apply the address regex here too - maybe not if we let users enter arbitrary strings for address
  decimals: z.number(),
  media: MediaSchema
})

export type CustomToken = z.infer<typeof CustomTokenSchema>
