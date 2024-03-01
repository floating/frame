import log from 'electron-log'

import { v38StateSchema } from '../38/schema'

function baseSepolia() {
  const chain = {
    id: 84532,
    type: 'ethereum',
    layer: 'testnet',
    isTestnet: true,
    name: 'Base Sepolia',
    explorer: 'https://sepolia.basescan.org/',
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
      symbol: 'sepETH',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Base Sepolia Ether',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
    primaryColor: 'accent2' // Testnet
  } as const

  return { chain, metadata }
}

function optimismSepolia() {
  const chain = {
    id: 11155420,
    type: 'ethereum',
    layer: 'testnet',
    isTestnet: true,
    name: 'Optimism Sepolia',
    explorer: 'https://sepolia-optimism.etherscan.io/',
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
      symbol: 'sepETH',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Optimism Sepolia Ether',
      decimals: 18
    },
    icon: '',
    primaryColor: 'accent2' // Testnet
  } as const

  return { chain, metadata }
}

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)
    const usingBaseSepolia = '84532' in state.main.networks.ethereum

    if (!usingBaseSepolia) {
      const { chain, metadata } = baseSepolia()
      state.main.networks.ethereum[84532] = chain
      state.main.networksMeta.ethereum[84532] = metadata
    }

    const usingOptimismSepolia = '11155420' in state.main.networks.ethereum

    if (!usingOptimismSepolia) {
      const { chain, metadata } = optimismSepolia()
      state.main.networks.ethereum[11155420] = chain
      state.main.networksMeta.ethereum[11155420] = metadata
    }

    return state
  } catch (e) {
    log.error('Migration 41: could not parse state', e)
  }

  return initial
}

export default {
  version: 41,
  migrate
}
