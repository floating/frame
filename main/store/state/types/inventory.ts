import { z } from 'zod'

const AssetSchema = z
  .object({
    name: z.string()
  })
  .and(z.record(z.string(), z.any()))

const CollectionSchema = z.object({
  meta: z.any(),
  items: z.record(z.string(), AssetSchema)
})

export type InventoryAsset = z.infer<typeof AssetSchema>
export type InventoryCollection = z.infer<typeof CollectionSchema>
