import { z } from 'zod'
import { v40 as v40MediaSchema } from './media'

const v40InventoryAssetSchema = z.object({
  name: z.string(),
  tokenId: z.string(),
  contract: z.string(),
  media: v40MediaSchema,
  externalLink: z.string().optional()
})

const v40InventoryCollection = z.object({
  meta: z.object({
    name: z.string(),
    description: z.string(),
    media: v40MediaSchema,
    chainId: z.number(),
    tokens: z.array(z.string()),
    external_url: z.string().optional(),
    hideByDefault: z.boolean()
  }),
  items: z.array(v40InventoryAssetSchema)
})

const v40 = z.record(v40InventoryCollection)
const latestCollectionSchema = v40InventoryCollection

const latest = v40.catch({}).default({})

export { v40InventoryCollection as v40, latest }

export type InventoryAsset = z.infer<typeof latestCollectionSchema.shape.items.element>
export type InventoryCollection = z.infer<typeof latestCollectionSchema>
