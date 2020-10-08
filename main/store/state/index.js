const { v5: uuidv5 } = require('uuid')

const persist = require('../persist')

const get = (path, obj = persist.get('main')) => {
  path.split('.').some((key, i) => {
    if (typeof obj !== 'object') { obj = undefined } else { obj = obj[key] }
    return obj === undefined // Stop navigating the path if we get to undefined value
  })
  return obj
}

const main = (path, def) => {
  const found = get(path)
  if (found === undefined) return def
  return found
}

const initial = {
  panel: {
    show: false,
    view: 'default'
  },
  view: { current: '', list: [], data: {}, notify: '', notifyData: {}, badge: '', addAccount: '' },
  signers: {},
  tray: {
    open: false,
    initial: true
  },
  balances: {},
  selected: {
    minimized: true,
    open: false,
    current: '',
    view: 'default',
    settings: {
      viewIndex: 0,
      views: ['permissions', 'verify', 'control'],
      subIndex: 0
    },
    addresses: [],
    showAccounts: false,
    accountPage: 0,
    position: {
      scrollTop: 0,
      initial: {
        top: 5,
        left: 5,
        right: 5,
        bottom: 5,
        height: 5,
        index: 0
      }
    }
  },
  frame: {
    type: 'tray'
  },
  node: {
    provider: false
  },
  provider: {
    events: []
  },
  external: {
    rates: {}
  },
  main: {
    _version: main('_version', 3),
    mute: {
      alphaWarning: main('mute.alphaWarning', false),
      externalLinkWarning: main('mute.externalLinkWarning', false)
    },
    launch: main('launch', false),
    reveal: main('reveal', false),
    ledger: {
      derivation: main('ledger.derivation', 'legacy')
    },
    accounts: main('accounts', {}),
    addresses: main('addresses', {}), // New persisted address permissions
    signers: {},
    savedSigners: {},
    updater: {
      dontRemind: main('updater.dontRemind', [])
    },
    clients: {
      ipfs: {
        on: false, // main('clients.ipfs.on', false),
        installed: false,
        latest: false,
        version: null,
        state: 'off'
      },
      geth: {
        on: false, // main('clients.geth.on', false),
        blockNumber: 0,
        currentBlock: 0,
        highestBlock: 0,
        installed: false,
        latest: false,
        version: null,
        state: 'off'
      },
      parity: {
        on: main('clients.parity.on', false),
        blockNumber: 0,
        currentBlock: 0,
        highestBlock: 0,
        installed: false,
        latest: false,
        version: null,
        state: 'off'
      }
    },
    currentNetwork: {
      type: 'ethereum', 
      id: 1
    },
    networks: {
      ethereum: {
        1: {
          id: 1,
          type: 'ethereum',
          name: 'Mainnet',
          explorer: 'https://etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
            }
          },
          connection: {
            presets: { infura: 'infura', local: 'direct' },
            primary: { on: true, current: 'infura', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          preset: true,
          hidden: false
        },
        3: {
          id: 3,
          type: 'ethereum',
          name: 'Ropsten',
          explorer: 'https://ropsten.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
            }
          },
          connection: {
            presets: { infura: 'infuraRopsten', local: 'direct' },
            primary: { on: true, current: 'infuraRopsten', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          preset: true,
          hidden: false
        },
        4: {
          id: 4,
          type: 'ethereum',
          name: 'Rinkeby',
          explorer: 'https://rinkeby.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
            }
          },
          connection: {
            presets: { infura: 'infuraRinkeby', local: 'direct' },
            primary: { on: true, current: 'infuraRinkeby', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          preset: true,
          hidden: false
        },
        5: {
          id: 5,
          type: 'ethereum',
          name: 'Görli',
          explorer: 'https://goerli.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
            }
          },
          connection: {
            presets: { prylabs: 'https://goerli.prylabs.net', local: 'direct' },
            primary: { on: true, current: 'prylabs', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          preset: true,
          hidden: false
        },
        42: {
          id: 42,
          type: 'ethereum',
          name: 'Kovan',
          explorer: 'https://kovan.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
            }
          },
          connection: {
            presets: { infura: 'infuraKovan', local: 'direct' },
            primary: { on: true, current: 'infuraKovan', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          preset: true,
          hidden: false
        },
        74: {
          id: 74,
          type: 'ethereum',
          name: 'IDChain',
          explorer: 'https://explorer.idchain.one',
          gas: {
            price: {
              selected: 'standard',
              levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
            }
          },
          connection: {
            presets: { local: 'direct' },
            primary: { on: true, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          preset: true,
          hidden: false
        },
        100: {
          id: 100,
          type: 'ethereum',
          name: 'xDai',
          explorer: 'https://blockscout.com/poa/xdai',
          gas: {
            price: {
              selected: 'standard',
              levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
            }
          },
          connection: {
            presets: { poa: 'https://dai.poa.network', local: 'direct' },
            primary: { on: true, current: 'poa', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          preset: true,
          hidden: false
        }
      }
    },
    gasPrice: {
      1: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      },
      3: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      },
      4: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      },
      5: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      },
      42: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      },
      74: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      },
      100: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      }
    },
    connection: {
      network: main('connection.network', '1'),
      local: {
        settings: {
          1: {
            current: main('connection.local.settings.1.current', 'infura'),
            options: {
              infura: 'infura',
              custom: main('connection.local.settings.1.options.custom', ''),
              local: 'direct'
            }
          },
          3: {
            current: main('connection.local.settings.3.current', 'infura'),
            options: {
              infura: 'infuraRopsten',
              custom: main('connection.local.settings.3.options.custom', ''),
              local: 'direct'
            }
          },
          4: {
            current: main('connection.local.settings.4.current', 'infura'),
            options: {
              infura: 'infuraRinkeby',
              custom: main('connection.local.settings.4.options.custom', ''),
              local: 'direct'
            }
          },
          5: {
            current: main('connection.local.settings.5.current', 'prylabs'),
            options: {
              prylabs: 'https://goerli.prylabs.net',
              custom: main('connection.local.settings.5.options.custom', ''),
              local: 'direct'
            }
          },
          42: {
            current: main('connection.local.settings.42.current', 'infura'),
            options: {
              infura: 'infuraKovan',
              custom: main('connection.local.settings.42.options.custom', ''),
              local: 'direct'
            }
          },
          74: {
            current: main('connection.local.settings.74.current', 'custom'),
            options: {
              custom: main('connection.local.settings.74.options.custom', ''),
              local: 'direct'
            }
          },
          100: {
            current: main('connection.local.settings.100.current', 'poa'),
            options: {
              poa: 'https://dai.poa.network',
              custom: main('connection.local.settings.100.options.custom', ''),
              local: 'direct'
            }
          }
        },
        on: main('connection.local.on', true),
        status: 'loading',
        connected: false,
        type: '',
        network: ''
      },
      secondary: {
        settings: {
          1: {
            current: main('connection.secondary.settings.1.current', 'custom'),
            options: {
              infura: 'infura',
              custom: main('connection.secondary.settings.1.options.custom', ''),
              local: 'direct'
            }
          },
          3: {
            current: main('connection.secondary.settings.3.current', 'custom'),
            options: {
              infura: 'infuraRopsten',
              custom: main('connection.secondary.settings.3.options.custom', ''),
              local: 'direct'
            }
          },
          4: { 
            current: main('connection.secondary.settings.4.current', 'custom'),
            options: {
              infura: 'infuraRinkeby',
              custom: main('connection.secondary.settings.4.options.custom', ''),
              local: 'direct'
            }
          },
          5: {
            current: main('connection.local.settings.5.current', 'prylabs'),
            options: {
              prylabs: 'https://goerli.prylabs.net',
              custom: main('connection.local.settings.5.options.custom', ''),
              local: 'direct'
            }
          },
          42: {
            current: main('connection.secondary.settings.42.current', 'custom'),
            options: {
              infura: 'infuraKovan',
              custom: main('connection.secondary.settings.42.options.custom', ''),
              local: 'direct'
            }
          },
          74: {
            current: main('connection.secondary.settings.74.current', 'custom'),
            options: {
              custom: main('connection.secondary.settings.74.options.custom', ''),
              local: 'direct'
            }
          },
          100: {
            current: main('connection.secondary.settings.100.current', 'poa'),
            options: {
              poa: 'https://dai.poa.network',
              custom: main('connection.secondary.settings.100.options.custom', ''),
              local: 'direct'
            }
          }
        },
        on: main('connection.secondary.on', false),
        status: 'loading',
        connected: false,
        type: '',
        network: ''
      }
    }
  }
}

// Persist these paths
const syncPaths = [
  'main.networks'
]

// Rename direct to local
if (initial.main.connection.local.settings[1].current === 'direct') initial.main.connection.local.settings[1].current = 'local'
if (initial.main.connection.local.settings[3].current === 'direct') initial.main.connection.local.settings[3].current = 'local'
if (initial.main.connection.local.settings[4].current === 'direct') initial.main.connection.local.settings[4].current = 'local'
if (initial.main.connection.local.settings[42].current === 'direct') initial.main.connection.local.settings[42].current = 'local'

if (initial.main.connection.secondary.settings[1].current === 'direct') initial.main.connection.secondary.settings[1].current = 'local'
if (initial.main.connection.secondary.settings[3].current === 'direct') initial.main.connection.secondary.settings[3].current = 'local'
if (initial.main.connection.secondary.settings[4].current === 'direct') initial.main.connection.secondary.settings[4].current = 'local'
if (initial.main.connection.secondary.settings[42].current === 'direct') initial.main.connection.secondary.settings[42].current = 'local'

// Earlier prerelease versions of 0.3.2 used 'normal' instead of 'standard'
Object.keys(initial.main.gasPrice).forEach(network => {
  if (initial.main.gasPrice[network].default === 'normal') initial.main.gasPrice[network].default = 'standard'
})

// Remove permissions granted to unknown origins
Object.keys(initial.main.addresses).forEach(address => {
  address = initial.main.addresses[address]
  if (address && address.permissions) {
    delete address.permissions[uuidv5('Unknown', uuidv5.DNS)]
  }
})

// If state still had inital.main.gasPrice, move gas settings into networks
if (initial.main.gasPrice) {
  // For each network with gasPrices, copy over default and custom level
  Object.keys(initial.main.gasPrice).forEach(network => {
    initial.main.networks.ethereum[network].gas.price.selected = initial.main.gasPrice[network].default
    initial.main.networks.ethereum[network].gas.price.levels.custom = initial.main.gasPrice[network].levels.custom
  })
  // Delete initial.main.gasPrice
  delete initial.main.gasPrice
}

// If state still had inital.main.connection, move connection settings into networks 
if (initial.main.connection) {
  // Copy all local connection settings to new connection object
  if (initial.main.connection.local && initial.main.connection.local.settings) {
    Object.keys(initial.main.connection.local.settings).forEach(id => {
      // Copy local custom endpoint to new connection object
      if (initial.main.connection.local.settings[id].options && initial.main.networks.ethereum[id].connection && initial.main.networks.ethereum[id].connection.primary) {
        initial.main.networks.ethereum[id].connection.primary.custom = initial.main.connection.local.settings[id].options.custom
      }
      // Copy local current selection to new connection object
      if (initial.main.connection.local.settings[id].current) {
        initial.main.networks.ethereum[id].connection.primary.current = initial.main.connection.local.settings[id].current
      }
    })
  }
  
  // Copy all secondary connection settings to new connection object
  if (initial.main.connection.secondary && initial.main.connection.secondary.settings) {
    Object.keys(initial.main.connection.secondary.settings).forEach(id => {
      // Copy all secondary connection settings to new connection object
      if (initial.main.connection.secondary.settings[id].options && initial.main.networks.ethereum[id].connection && initial.main.networks.ethereum[id].connection.primary) {
        initial.main.networks.ethereum[id].connection.secondary.custom = initial.main.connection.secondary.settings[id].options.custom
      }
  
      // Copy local current selection to new connection object
      if (initial.main.connection.secondary.settings[id].current) {
        initial.main.networks.ethereum[id].connection.secondary.current = initial.main.connection.secondary.settings[id].current
      }
    })
  }
  // Copy primary/secondary on/off
  Object.keys(initial.main.networks.ethereum).forEach(id => {
    initial.main.networks.ethereum[id].connection.primary.on = initial.main.connection.local.on
    initial.main.networks.ethereum[id].connection.secondary.on = initial.main.connection.secondary.on
  })
  // Copy current network
  initial.main.currentNetwork = {
    type: 'ethereum', 
    id: initial.main.connection.network
  } 
  // Delete initial.main.connection
  delete initial.main.connection
}

module.exports = () => initial
