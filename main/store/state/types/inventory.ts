import { z } from 'zod'

const InventoryAssetSchema = z.object({
  name: z.string(),
  tokenId: z.string(),
  contract: z.string(),
  image: z.object({
    source: z.string(),
    cdn: z.object({
      original: z.object({
        main: z.string().optional(),
        thumb: z.string().optional()
      }),
      frozen: z.object({
        main: z.string().optional(),
        thumb: z.string().optional()
      })
    })
  }),
  externalLink: z.string().optional()
})

const InventoryCollectionSchema = z.object({
  meta: z.object({
    name: z.string(),
    description: z.string(),
    image: z.object({
      source: z.string(),
      cdn: z.object({
        original: z.object({
          main: z.string().optional(),
          thumb: z.string().optional()
        }),
        frozen: z.object({
          main: z.string().optional(),
          thumb: z.string().optional()
        })
      })
    }),
    chainId: z.number(),
    tokens: z.array(z.string()),
    external_url: z.string().optional()
  }),
  items: z.array(InventoryAssetSchema)
})

const InventorySchema = z.record(InventoryCollectionSchema)

export type InventoryAsset = z.infer<typeof InventoryAssetSchema>
export type InventoryCollection = z.infer<typeof InventoryCollectionSchema>
export type Inventory = z.infer<typeof InventorySchema>
