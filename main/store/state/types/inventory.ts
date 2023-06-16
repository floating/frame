import { z } from 'zod'
import { MediaSchema } from './media'

const InventoryAssetSchema = z.object({
  name: z.string(),
  tokenId: z.string(),
  contract: z.string(),
  media: MediaSchema,
  externalLink: z.string().optional()
})

const InventoryCollectionSchema = z.object({
  meta: z.object({
    name: z.string(),
    description: z.string(),
    media: MediaSchema,
    chainId: z.number(),
    tokens: z.array(z.string()),
    external_url: z.string().optional(),
    hideByDefault: z.boolean()
  }),
  items: z.array(InventoryAssetSchema)
})

const InventorySchema = z.record(InventoryCollectionSchema)

export type InventoryAsset = z.infer<typeof InventoryAssetSchema>
export type InventoryCollection = z.infer<typeof InventoryCollectionSchema>
export type Inventory = z.infer<typeof InventorySchema>
