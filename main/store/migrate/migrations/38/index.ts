import log from 'electron-log'

import { v37Connection, v37StateSchema } from '../37/schema'

function removePoaConnection(connection: v37Connection) {
  // remove Gnosis chain preset
  const isPoa = connection.current === 'poa'

  if (isPoa) {
    log.info('Migration 38: removing POA presets from Gnosis chain')
  }

  return {
    ...connection,
    current: isPoa ? 'custom' : connection.current,
    custom: isPoa ? 'https://rpc.gnosischain.com' : connection.custom
  }
}

const migrate = (initial: unknown) => {
  try {
    const state = v37StateSchema.parse(initial)
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
    log.error('Migration 38: could not parse state', e)
  }

  return initial
}

export default {
  version: 38,
  migrate
}
