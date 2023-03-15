import { z } from 'zod'
import log from 'electron-log'

import type { Migration } from '../../state'

const ConnectionSchema = z
  .object({
    current: z.enum(['local', 'custom', 'infura', 'alchemy', 'poa']),
    on: z.boolean()
  })
  .passthrough()

const ChainSchema = z
  .object({
    id: z.coerce.number(),
    connection: z.object({
      primary: ConnectionSchema,
      secondary: ConnectionSchema
    })
  })
  .passthrough()

const ChainEntrySchema = z.tuple([z.coerce.number(), ChainSchema])

type LegacyChain = z.infer<typeof ChainSchema>
type LegacyConnection = z.infer<typeof ConnectionSchema>

function updateChain(chain: LegacyChain, replaceWithPylon = true) {
  const removeRpcConnection = (connection: LegacyConnection, replaceWithPylon = true) => {
    const isServiceRpc = connection.current === 'infura' || connection.current === 'alchemy'

    if (isServiceRpc) {
      log.info(`Migration 35: removing ${connection.current} preset from chain ${chain.id}`)
    }

    return {
      ...connection,
      current: isServiceRpc ? 'custom' : connection.current,
      custom: isServiceRpc ? '' : connection.custom
    }
  }

  const updateChain = (chain: Network) => {
    const { primary, secondary } = chain.connection

    const updatedChain = {
      ...chain,
      connection: {
        ...chain.connection,
        primary: removeRpcConnection(primary),
        secondary: removeRpcConnection(secondary)
      }
    }

    return updatedChain
  }

const generateMigration = (initial: any) => {
  const validate = () => {
    const chains = Object.entries(initial.main.networks.ethereum)

    // remove any chains that don't match the type expected by the migration
    const validChains = chains
      .filter((entry) => {
        const parsed = ChainEntrySchema.safeParse(entry)

        if (!parsed.success) {
          log.info(`Migration 35: removing invalid chain ${entry[0]} from state`)
          return false
        }

        return true
      })
      .map((entry) => ChainEntrySchema.parse(entry))

    return Object.fromEntries(validChains)
  }

  const migrate = (chainObjects: Record<number, LegacyChain>) => {
    const chains = Object.entries(chainObjects)

    // migrate existing Infura and Alchemy connections to use Pylon where applicable
    const pylonChains = chains
      .filter(([id]) => ['1', '5', '10', '137', '42161', '11155111'].includes(id))
      .map(([id, chain]) => [id, updateChain(chain)])

    // these connections previously used Infura and Alchemy and are not supported by Pylon
    const retiredChains = chains
      .filter(([id]) => ['3', '4', '42'].includes(id))
      .map(([id, chain]) => [id, updateChain(chain)])

    initial.main.networks.ethereum = Object.fromEntries([...chains, ...pylonChains, ...retiredChains])

    return initial
  }

  return { validate, migrate }
}

export default {
  version: 35,
  generateMigration
} as Migration<Record<string, LegacyChain>>
