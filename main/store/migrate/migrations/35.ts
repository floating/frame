import { z } from 'zod'
import log from 'electron-log'

const pylonChainIds = ['1', '5', '10', '137', '42161', '11155111']
const retiredChainIds = ['3', '4', '42']
const chainsToMigrate = [...pylonChainIds, ...retiredChainIds]

let showMigrationWarning = false

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

const ParsedChainSchema = z.union([ChainSchema, z.boolean()]).catch(false)

const EthereumChainsSchema = z.record(z.coerce.number(), ParsedChainSchema).transform((chains) => {
  // remove any chains that failed to parse, which will now be set to "false"
  // TODO: we can insert default chain data here from the state defaults in the future
  return Object.fromEntries(
    Object.entries(chains).filter(([id, chain]) => {
      if (chain === false) {
        log.info(`Migration 35: removing invalid chain ${id} from state`)
        return false
      }

      return true
    })
  )
})

const LegacyStateSchema = z.object({
  main: z
    .object({
      networks: z.object({
        ethereum: EthereumChainsSchema
      }),
      mute: z.object({}).passthrough().default({})
    })
    .passthrough()
})

type LegacyChain = z.infer<typeof ChainSchema>
type LegacyConnection = z.infer<typeof ConnectionSchema>

function updateChain(chain: LegacyChain) {
  const removeRpcConnection = (connection: LegacyConnection) => {
    const isServiceRpc = connection.current === 'infura' || connection.current === 'alchemy'

    if (isServiceRpc) {
      log.info(`Migration 35: removing ${connection.current} preset from chain ${chain.id}`)
      showMigrationWarning = true
    }

    return {
      ...connection,
      current: isServiceRpc ? 'custom' : connection.current,
      custom: isServiceRpc ? '' : connection.custom
    }
  }

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

const migrate = (initial: any) => {
  try {
    const state = LegacyStateSchema.parse(initial)

    const chainEntries = Object.entries(state.main.networks.ethereum)

    const migratedChains = chainEntries
      .filter(([id]) => chainsToMigrate.includes(id))
      .map(([id, chain]) => [id, updateChain(chain as LegacyChain)])

    initial.main.networks.ethereum = Object.fromEntries([...chainEntries, ...migratedChains])
    initial.main.mute.migrateToPylon = !showMigrationWarning
  } catch (e) {
    log.error('Migration 35: could not parse state', e)
  }

  return initial
}

export default {
  version: 35,
  migrate
}
