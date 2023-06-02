import { string, z } from 'zod'
import { MediaSchema } from './media'

const prefixedHexRegex = new RegExp('^0x[a-fA-F0-9]+$')
const addressRegex = new RegExp('^0x[a-fA-F0-9]{40}$')

const HexString = string().regex(prefixedHexRegex)

export const KnownTokenSchema = z.object({
  chainId: z.number(),
  address: z.string().regex(addressRegex),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  media: MediaSchema,
  balance: HexString,
  displayBalance: z.string() //TODO IntString schema?
})

export type KnownToken = z.infer<typeof KnownTokenSchema>
