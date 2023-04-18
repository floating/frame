import log from 'electron-log'

import { v36Connection, v36Preset, v36StateSchema } from '../36/schema'
import { v37Connection, v37Preset, v37State } from './schema'

function removePoaConnection(connection: v36Connection): v37Connection {
  // remove Gnosis chain preset
  const { current: currentPreset } = connection
  const isValidPreset = (current: v36Preset): current is v37Preset => {
    return current !== 'poa'
  }

  const isPoa = !isValidPreset(currentPreset)

  if (isPoa) {
    log.info('Migration 37: removing POA presets from Gnosis chain')
  }

  return {
    ...connection,
    current: isPoa ? 'custom' : currentPreset,
    custom: isPoa ? 'https://rpc.gnosischain.com' : connection.custom
  }
}

const migrate = (initial: unknown) => {
  try {
    const state = v36StateSchema.parse(initial)
    const gnosisChainPresent = '100' in state.main.networks.ethereum

    if (gnosisChainPresent) {
      const gnosisChain = state.main.networks.ethereum[100]

      const migratedState: v37State = {
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

    return state
  } catch (e) {
    log.error('Migration 37: could not parse state', e)
  }

  return initial
}

export default {
  version: 37,
  migrate
}
