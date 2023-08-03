import log from 'electron-log'

import { v38Connection, v38StateSchema } from '../38/schema'

function removePoaConnection(connection: v38Connection) {
  // remove Gnosis chain preset
  const isPoa = connection.current === 'poa'

  if (isPoa) {
    log.info('Migration 39: removing POA presets from Gnosis chain')
  }

  return {
    ...connection,
    current: isPoa ? 'custom' : connection.current,
    custom: isPoa ? 'https://rpc.gnosischain.com' : connection.custom
  }
}

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)
    const gnosisChainPresent = '100' in state.main.networks.ethereum

    if (gnosisChainPresent) {
      const gnosisChain = state.main.networks.ethereum[100]

      state.main.networks.ethereum[100] = {
        ...gnosisChain,
        connection: {
          primary: removePoaConnection(gnosisChain.connection.primary),
          secondary: removePoaConnection(gnosisChain.connection.secondary)
        }
      }
    }

    return state
  } catch (e) {
    log.error('Migration 39: could not parse state', e)
  }

  return initial
}

export default {
  version: 39,
  migrate
}
