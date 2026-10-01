export function rootstockNetwork(id: 30 | 31) {
  const isTestnet = id === 31
  const chain = {
    id,
    type: 'ethereum',
    layer: isTestnet ? 'testnet' : 'sidechain',
    isTestnet,
    name: isTestnet ? 'Rootstock Testnet' : 'Rootstock',
    explorer: isTestnet ? 'https://explorer.testnet.rootstock.io/' : 'https://explorer.rootstock.io/',
    gas: {
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    connection: {
      primary: {
        on: false,
        current: 'custom',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: isTestnet ? 'https://public-node.testnet.rsk.co' : 'https://public-node.rsk.co'
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
      symbol: isTestnet ? 'tRBTC' : 'RBTC',
      usd: { price: 0, change24hr: 0 },
      icon: '',
      name: isTestnet ? 'Testnet Rootstock Bitcoin' : 'Rootstock Bitcoin',
      decimals: 18
    },
    icon: '',
    primaryColor: 'accent2'
  } as const

  return { chain, metadata }
}
