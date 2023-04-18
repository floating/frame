import { z } from 'zod'
import log from 'electron-log'

import {
  v36Chain,
  v36ChainSchema,
  v36ChainsSchema,
  v36Connection,
  v36MainSchema,
  v36StateSchema
} from './schema'

const pylonChainIds = ['1', '5', '10', '137', '42161', '11155111']
const retiredChainIds = ['3', '4', '42']
const chainsToMigrate = [...pylonChainIds, ...retiredChainIds]

// because this is the first migration that uses Zod parsing and validation,
// create a version of the schema that removes invalid chains, allowing them to
// also be "false" so that we can filter them out later in a transform. future migrations
// that use this schema can be sure that the chains are all valid afterwards
const ParsedChainSchema = z.union([v36ChainSchema, z.boolean()]).catch(false)

const EthereumChainsSchema = z.record(z.coerce.number(), ParsedChainSchema).transform((chains) => {
  // remove any chains that failed to parse, which will now be set to "false"
  // TODO: we can insert default chain data here from the state defaults in the future
  return Object.fromEntries(
    Object.entries(chains).filter(([id, chain]) => {
      if (chain === false) {
        log.info(`Migration 36: removing invalid chain ${id} from state`)
        return false
      }

      return true
    })
  )
})

const ChainsSchema = v36ChainsSchema.merge(
  z.object({
    ethereum: EthereumChainsSchema
  })
)

const MainSchema = v36MainSchema
  .merge(
    z.object({
      networks: ChainsSchema
    })
  )
  .passthrough()

const StateSchema = v36StateSchema.merge(z.object({ main: MainSchema })).passthrough()

const migrate = (initial: unknown) => {
  let showMigrationWarning = false

  const updateChain = (chain: v36Chain) => {
    const removeRpcConnection = (connection: v36Connection) => {
      const isServiceRpc = connection.current === 'infura' || connection.current === 'alchemy'

      if (isServiceRpc) {
        log.info(`Migration 36: removing ${connection.current} preset from chain ${chain.id}`)
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
      .map(([id, chain]) => [id, updateChain(chain as v36Chain)])

    state.main.networks.ethereum = Object.fromEntries([...chainEntries, ...migratedChains])
    state.main.mute.migrateToPylon = !showMigrationWarning

    return state
  } catch (e) {
    log.error('Migration 36: could not parse state', e)
  }

  return initial
}

export default {
  version: 36,
  migrate
}
