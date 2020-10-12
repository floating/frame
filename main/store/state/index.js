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
  view: {
    current: '',
    list: [],
    data: {},
    notify: '',
    notifyData: {},
    badge: '',
    addAccount: '', // Add view (needs to be merged into Phase)
    addNetwork: false // Phase view (needs to be merged with Add)
  },
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
    currentNetwork: main('currentNetwork', {
      type: 'ethereum',
      id: '1'
    }),
    networkPresets: {
      ethereum: {
        default: {
          local: 'direct'
        },
        1: {
          infura: 'infura'
        },
        3: {
          infura: 'infuraRopsten'
        },
        4: {
          infura: 'infuraRinkeby'
        },
        5: {
          prylabs: 'https://goerli.prylabs.net'
        },
        42: {
          infura: 'infuraKovan'
        },
        74: {
          idchain: 'wss://idchain.one/ws/'
        },
        100: {
          poa: 'https://dai.poa.network'
        }
      }
    },
    networks: main('networks', {
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
            primary: { on: true, current: 'infura', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
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
            primary: { on: true, current: 'infuraRopsten', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
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
            primary: { on: true, current: 'infuraRinkeby', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
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
            primary: { on: true, current: 'prylabs', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
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
            primary: { on: true, current: 'infuraKovan', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
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
            primary: { on: true, current: 'idchain', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
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
            primary: { on: true, current: 'poa', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          }
        }
      }
    })
  }
}

// New perist pattern, persist these paths
// const syncPaths = [
//   'main.networks'
// ]

// Remove permissions granted to unknown origins
Object.keys(initial.main.addresses).forEach(address => {
  address = initial.main.addresses[address]
  if (address && address.permissions) {
    delete address.permissions[uuidv5('Unknown', uuidv5.DNS)]
  }
})

// If persisted state still has main.gasPrice, move gas settings into networks
const gasPrice = main('gasPrice', false)

if (gasPrice) {
  Object.keys(gasPrice).forEach(network => {
    // Prerelease versions of 0.3.2 used 'normal' instead of 'standard'
    if (gasPrice[network].default === 'normal') gasPrice[network].default = 'standard'
    // For each network with gasPrices, copy over default and custom level
    if (initial.main.networks.ethereum[network] && initial.main.networks.ethereum[network].gas) {
      initial.main.networks.ethereum[network].gas.price.selected = gasPrice[network].default
      initial.main.networks.ethereum[network].gas.price.levels.custom = gasPrice[network].levels.custom
    }
  })
}

// If persisted state state still has main.connection, move connection settings into networks
const connection = main('connection', false)
if (connection) {
  // Copy all local connection settings to new connection object
  if (connection.local && connection.local.settings) {
    Object.keys(connection.local.settings).forEach(id => {
      if (connection.secondary.settings[id] && initial.main.networks.ethereum[id] && initial.main.networks.ethereum[id].connection) {
        // Copy local custom endpoint to new connection object
        if (connection.local.settings[id].options) initial.main.networks.ethereum[id].connection.primary.custom = connection.local.settings[id].options.custom
        // Copy local current selection to new connection object
        if (connection.local.settings[id].current) initial.main.networks.ethereum[id].connection.primary.current = connection.local.settings[id].current
      }
    })
  }
  // Copy all secondary connection settings to new connection object
  if (connection.secondary && connection.secondary.settings) {
    Object.keys(connection.secondary.settings).forEach(id => {
      if (connection.secondary.settings[id] && initial.main.networks.ethereum[id] && initial.main.networks.ethereum[id].connection) {
        // Copy all secondary connection settings to new connection object
        if (connection.secondary.settings[id].options) initial.main.networks.ethereum[id].connection.secondary.custom = connection.secondary.settings[id].options.custom
        // Copy local current selection to new connection object
        if (connection.secondary.settings[id].current) initial.main.networks.ethereum[id].connection.secondary.current = connection.secondary.settings[id].current
      }
    })
  }
  // Copy primary/secondary on/off
  Object.keys(initial.main.networks.ethereum).forEach(id => {
    initial.main.networks.ethereum[id].connection.primary.on = connection.local.on
    initial.main.networks.ethereum[id].connection.secondary.on = connection.secondary.on
  })
  initial.main.currentNetwork.id = connection.network + '' || initial.main.currentNetwork.id || '1'
}

module.exports = () => initial

// connection: {
//   network: main('connection.network', '1'),
//   local: {
//     settings: {
//       1: {
//         current: main('connection.local.settings.1.current', 'infura'),
//         options: {
//           infura: 'infura',
//           custom: main('connection.local.settings.1.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       3: {
//         current: main('connection.local.settings.3.current', 'infura'),
//         options: {
//           infura: 'infuraRopsten',
//           custom: main('connection.local.settings.3.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       4: {
//         current: main('connection.local.settings.4.current', 'infura'),
//         options: {
//           infura: 'infuraRinkeby',
//           custom: main('connection.local.settings.4.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       5: {
//         current: main('connection.local.settings.5.current', 'prylabs'),
//         options: {
//           prylabs: 'https://goerli.prylabs.net',
//           custom: main('connection.local.settings.5.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       42: {
//         current: main('connection.local.settings.42.current', 'infura'),
//         options: {
//           infura: 'infuraKovan',
//           custom: main('connection.local.settings.42.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       74: {
//         current: main('connection.local.settings.74.current', 'custom'),
//         options: {
//           custom: main('connection.local.settings.74.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       100: {
//         current: main('connection.local.settings.100.current', 'poa'),
//         options: {
//           poa: 'https://dai.poa.network',
//           custom: main('connection.local.settings.100.options.custom', ''),
//           local: 'direct'
//         }
//       }
//     },
//     on: main('connection.local.on', true),
//     status: 'loading',
//     connected: false,
//     type: '',
//     network: ''
//   },
//   secondary: {
//     settings: {
//       1: {
//         current: main('connection.secondary.settings.1.current', 'custom'),
//         options: {
//           infura: 'infura',
//           custom: main('connection.secondary.settings.1.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       3: {
//         current: main('connection.secondary.settings.3.current', 'custom'),
//         options: {
//           infura: 'infuraRopsten',
//           custom: main('connection.secondary.settings.3.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       4: {
//         current: main('connection.secondary.settings.4.current', 'custom'),
//         options: {
//           infura: 'infuraRinkeby',
//           custom: main('connection.secondary.settings.4.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       5: {
//         current: main('connection.local.settings.5.current', 'prylabs'),
//         options: {
//           prylabs: 'https://goerli.prylabs.net',
//           custom: main('connection.local.settings.5.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       42: {
//         current: main('connection.secondary.settings.42.current', 'custom'),
//         options: {
//           infura: 'infuraKovan',
//           custom: main('connection.secondary.settings.42.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       74: {
//         current: main('connection.secondary.settings.74.current', 'custom'),
//         options: {
//           custom: main('connection.secondary.settings.74.options.custom', ''),
//           local: 'direct'
//         }
//       },
//       100: {
//         current: main('connection.secondary.settings.100.current', 'poa'),
//         options: {
//           poa: 'https://dai.poa.network',
//           custom: main('connection.secondary.settings.100.options.custom', ''),
//           local: 'direct'
//         }
//       }
//     },
//     on: main('connection.secondary.on', false),
//     status: 'loading',
//     connected: false,
//     type: '',
//     network: ''
//   }
// }

// Rename direct to local
// if (initial.main.connection.local.settings[1].current === 'direct') initial.main.connection.local.settings[1].current = 'local'
// if (initial.main.connection.local.settings[3].current === 'direct') initial.main.connection.local.settings[3].current = 'local'
// if (initial.main.connection.local.settings[4].current === 'direct') initial.main.connection.local.settings[4].current = 'local'
// if (initial.main.connection.local.settings[42].current === 'direct') initial.main.connection.local.settings[42].current = 'local'

// if (initial.main.connection.secondary.settings[1].current === 'direct') initial.main.connection.secondary.settings[1].current = 'local'
// if (initial.main.connection.secondary.settings[3].current === 'direct') initial.main.connection.secondary.settings[3].current = 'local'
// if (initial.main.connection.secondary.settings[4].current === 'direct') initial.main.connection.secondary.settings[4].current = 'local'
// if (initial.main.connection.secondary.settings[42].current === 'direct') initial.main.connection.secondary.settings[42].current = 'local'
