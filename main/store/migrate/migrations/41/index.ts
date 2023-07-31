import log from 'electron-log'

import { v38StateSchema } from '../38/schema'

function baseMainnet() {
  const chain = {
    id: 8453,
    type: 'ethereum',
    layer: 'sidechain',
    isTestnet: false,
    name: 'Base',
    explorer: 'https://basescan.org',
    gas: {
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    connection: {
      primary: {
        on: true,
        current: 'pylon',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: ''
      }
    },
    on: false
  } as const

  const metadata = {
    blockHeight: 0,
    gas: {
      fees: {},
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      symbol: 'ETH',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Ether',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
    primaryColor: 'accent8' // Base
  } as const

  return { chain, metadata }
}

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)
    const usingBase = '8453' in state.main.networks.ethereum

    if (!usingBase) {
      const { chain, metadata } = baseMainnet()
      state.main.networks.ethereum[8453] = chain
      state.main.networksMeta.ethereum[8453] = metadata
    }

    return state
  } catch (e) {
    log.error('Migration 40: could not parse state', e)
  }

  return initial
}

export default {
  version: 41,
  migrate
}
