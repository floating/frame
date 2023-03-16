import { z } from 'zod'
import log from 'electron-log'
import { v35Chain, v35ChainSchema, v35Connection, v35StateSchema } from './schema'

const pylonChainIds = ['1', '5', '10', '137', '42161', '11155111']
const retiredChainIds = ['3', '4', '42']
const chainsToMigrate = [...pylonChainIds, ...retiredChainIds]

// this schema reflects chains after they've been parsed and validated
const ParsedChainSchema = z.union([v35ChainSchema, z.boolean()]).catch(false)

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

const StateSchema = z.object({
  main: z
    .object({
      networks: z.object({
        ethereum: EthereumChainsSchema
      }),
      mute: v35StateSchema.shape.main.shape.mute
    })
    .passthrough()
})

const migrate = (initial: unknown) => {
  let showMigrationWarning = false

  const updateChain = (chain: v35Chain) => {
    const removeRpcConnection = (connection: v35Connection) => {
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

  try {
    const state = StateSchema.parse(initial)

    const chainEntries = Object.entries(state.main.networks.ethereum)

    const migratedChains = chainEntries
      .filter(([id]) => chainsToMigrate.includes(id))
      .map(([id, chain]) => [id, updateChain(chain as v35Chain)])

    state.main.networks.ethereum = Object.fromEntries([...chainEntries, ...migratedChains])
    state.main.mute.migrateToPylon = !showMigrationWarning

    return state
  } catch (e) {
    log.error('Migration 35: could not parse state', e)
  }

  return initial
}

export default {
  version: 35,
  migrate
}
