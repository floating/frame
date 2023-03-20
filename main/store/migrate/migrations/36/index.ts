import log from 'electron-log'

import { v35Connection, v35StateSchema } from '../35/schema'

function removePoaConnection(connection: v35Connection) {
  // remove Gnosis chain preset
  const isPoa = connection.current === 'poa'

  if (isPoa) {
    log.info('Migration 36: removing POA presets from Gnosis chain')
  }

  return {
    ...connection,
    current: isPoa ? 'custom' : connection.current,
    custom: isPoa ? 'https://rpc.gnosischain.com' : connection.custom
  }
}

const migrate = (initial: unknown) => {
  try {
    const state = v35StateSchema.parse(initial)
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
    log.error('Migration 36: could not parse state', e)
  }

  return initial
}

export default {
  version: 36,
  migrate
}
