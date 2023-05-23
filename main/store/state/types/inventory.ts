import { z } from 'zod'

// Schema for InventoryAsset
const InventoryAssetSchema = z.object({
  name: z.string(),
  tokenId: z.string(),
  img: z.string(),
  contract: z.string(),
  externalLink: z.string().optional()
})

// Schema for InventoryCollection
const InventoryCollectionSchema = z.object({
  meta: z.object({
    name: z.string(),
    description: z.string(),
    image: z.string(),
    chainId: z.number(),
    external_url: z.string().optional(),
    ownedItems: z.array(z.string())
  }),
  items: z.record(InventoryAssetSchema)
})

// Schema for Inventory
const InventorySchema = z.record(InventoryCollectionSchema)

export type InventoryAsset = z.infer<typeof InventoryAssetSchema>
export type InventoryCollection = z.infer<typeof InventoryCollectionSchema>
export type Inventory = z.infer<typeof InventorySchema>
