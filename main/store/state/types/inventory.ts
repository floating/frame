import { z } from 'zod'

const InventoryAssetSchema = z.object({
  name: z.string(),
  tokenId: z.string(),
  img: z.string(),
  contract: z.string(),
  externalLink: z.string().optional()
})

const InventoryCollectionSchema = z.object({
  meta: z.object({
    name: z.string(),
    description: z.string(),
    image: z.string(),
    chainId: z.number(),
    external_url: z.string().optional(),
    itemCount: z.number().default(0)
  }),
  items: z.record(InventoryAssetSchema)
})

const InventorySchema = z.record(InventoryCollectionSchema)

export type InventoryAsset = z.infer<typeof InventoryAssetSchema>
export type InventoryCollection = z.infer<typeof InventoryCollectionSchema>
export type Inventory = z.infer<typeof InventorySchema>
