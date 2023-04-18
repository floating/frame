import log from 'electron-log'

import { v36Chain, v36State } from './schema'
import { LegacyChain, LegacyConnection, LegacyStateSchema } from '../legacy/schema'

const pylonChainIds = ['1', '5', '10', '137', '42161', '11155111']
const retiredChainIds = ['3', '4', '42']
const chainsToMigrate = [...pylonChainIds, ...retiredChainIds]

const migrate = (initial: unknown) => {
  let showMigrationWarning = false

  const updateChain = (chain: LegacyChain) => {
    const removeRpcConnection = (connection: LegacyConnection) => {
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
    const state = LegacyStateSchema.parse(initial)

    const chainEntries = Object.entries(state.main.networks.ethereum)

    const migratedChains = chainEntries
      .filter(([id]) => chainsToMigrate.includes(id))
      .map(([id, chain]) => [id, updateChain(chain as LegacyChain)])

    const migratedState: v36State = {
      ...state,
      main: {
        ...state.main,
        networks: {
          ethereum: Object.fromEntries([...chainEntries, ...migratedChains])
        },
        mute: {
          migrateToPylon: !showMigrationWarning
        }
      }
    }

    return migratedState
  } catch (e) {
    log.error('Migration 36: could not parse state', e)
  }

  return initial
}

export default {
  version: 36,
  migrate
}
