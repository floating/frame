import { z } from 'zod'
import log from 'electron-log'

import { v35Connection, v35Preset, v35StateSchema } from '../35/schema'
import { v36Connection, v36Preset, v36State } from './schema'

function removePoaConnection(connection: v35Connection): v36Connection {
  // remove Gnosis chain preset
  const { current: currentPreset } = connection
  const isValidPreset = (current: v35Preset): current is v36Preset => {
    return current !== 'poa'
  }

  const isPoa = !isValidPreset(currentPreset)

// because this is the first migration that uses Zod parsing and validation,
// create a version of the schema that removes invalid chains, allowing them to
// also be "false" so that we can filter them out later in a transform. future migrations
// that use this schema can be sure that the chains are all valid afterwards
const ParsedChainSchema = z.union([v36ChainSchema, z.boolean()]).catch(false)

  return {
    ...connection,
    current: isPoa ? 'custom' : currentPreset,
    custom: isPoa ? 'https://rpc.gnosischain.com' : connection.custom
  }
}

const migrate = (initial: unknown) => {
  try {
    const state = v35StateSchema.parse(initial)
    const gnosisChainPresent = '100' in state.main.networks.ethereum

    if (gnosisChainPresent) {
      const gnosisChain = state.main.networks.ethereum[100]

      const migratedState: v36State = {
        ...state,
        main: {
          ...state.main,
          networks: {
            ethereum: {
              100: {
                ...gnosisChain,
                connection: {
                  primary: removePoaConnection(gnosisChain.connection.primary),
                  secondary: removePoaConnection(gnosisChain.connection.secondary)
                }
              }
            }
          }
        }
      }

      return migratedState
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
