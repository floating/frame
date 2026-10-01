import log from 'electron-log'

import { v38StateSchema } from '../38/schema'
import { rootstockNetwork } from '../../../state/rootstock'

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)

    for (const id of [30, 31] as const) {
      if (!(id in state.main.networks.ethereum)) {
        const { chain, metadata } = rootstockNetwork(id)
        state.main.networks.ethereum[id] = chain
        state.main.networksMeta.ethereum[id] = metadata
      }
    }

    return state
  } catch (e) {
    log.error('Migration 42: could not parse state', e)
    return initial
  }
}

export default { version: 42, migrate }
