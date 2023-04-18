import { z } from 'zod'
import log from 'electron-log'

// this schema represents the version of the state when we started using Zod, prior
// to state version 36

export const LegacyMuteSchema = z.object({}).passthrough()

const ShortcutsSchema = z
  .object({
    altSlash: z.boolean().default(true)
  })
  .passthrough()
  .default({})

const LegacyPresetSchema = z.enum(['local', 'custom', 'infura', 'alchemy', 'poa'])

export const LegacyConnectionSchema = z
  .object({
    current: LegacyPresetSchema,
    custom: z.string().default('')
  })
  .passthrough()

export const LegacyChainSchema = z
  .object({
    id: z.coerce.number(),
    connection: z.object({
      primary: LegacyConnectionSchema,
      secondary: LegacyConnectionSchema
    })
  })
  .passthrough()

// because this is the first schema that uses Zod parsing and validation,
// create a version that removes invalid chains, allowing them to
// also be "false" so that we can filter them out later in a transform. future migrations
// that use this schema can be sure that the chains are all valid afterwards
const ParsedChainSchema = z.union([LegacyChainSchema, z.boolean()]).catch(false)

const EthereumChainsSchema = z.record(z.coerce.number(), ParsedChainSchema).transform((chains) => {
  // remove any chains that failed to parse, which will now be set to "false"
  // TODO: we can insert default chain data here from the state defaults in the future
  return Object.fromEntries(
    Object.entries(chains).filter(([id, chain]) => {
      if (chain === false) {
        log.info(`Migration: removing invalid chain ${id} from state`)
        return false
      }

      return true
    })
  )
})

export const LegacyChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

export const LegacyMainSchema = z
  .object({
    networks: LegacyChainsSchema,
    mute: LegacyMuteSchema,
    shortcuts: ShortcutsSchema
  })
  .passthrough()

export const LegacyStateSchema = z
  .object({
    main: LegacyMainSchema
  })
  .passthrough()

export type LegacyPreset = z.infer<typeof LegacyPresetSchema>
export type LegacyConnection = z.infer<typeof LegacyConnectionSchema>
export type LegacyChain = z.infer<typeof LegacyChainSchema>
