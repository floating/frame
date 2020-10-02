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
    _version: main('_version', 1),
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
    networks: {
      1: {
        type: 'ethereum',
        slug: 'mainnet',
        name: 'Mainnet',
        explorer: 'https://etherscan.io'
      },
      3: {
        type: 'ethereum',
        slug: 'ropsten',
        name: 'Ropsten',
        explorer: 'https://ropsten.etherscan.io'
      },
      4: {
        type: 'ethereum',
        slug: 'rinkeby',
        name: 'Rinkeby',
        explorer: 'https://rinkeby.etherscan.io'
      },
      42: {
        type: 'ethereum',
        slug: 'kovan',
        name: 'Kovan',
        explorer: 'https://kovan.etherscan.io'
      },
      // 74: {
      //   type: 'ethereum',
      //   slug: 'idchain',
      //   name: 'IDChain',
      //   explorer: 'https://explorer.idchain.one'
      // },
      100: {
        type: 'ethereum',
        slug: 'xdai',
        name: 'xDai',
        explorer: 'https://blockscout.com/poa/xdai'
      }
    },
    gasPrice: main('gasPrice', {
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
      42: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      },
      // 74: {
      //   default: 'standard',
      //   levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      // },
      100: {
        default: 'standard',
        levels: { safelow: '', standard: '', fast: '', trader: '', custom: '' }
      }
    }),
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
          42: {
            current: main('connection.local.settings.42.current', 'infura'),
            options: {
              infura: 'infuraKovan',
              custom: main('connection.local.settings.42.options.custom', ''),
              local: 'direct'
            }
          },
          // 74: {
          //   current: main('connection.local.settings.74.current', 'idchain'),
          //   options: {
          //     idchain: 'https://idchain.one/api/eth_rpc',
          //     custom: main('connection.local.settings.74.options.custom', ''),
          //     local: 'direct'
          //   }
          // },
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
          42: {
            current: main('connection.secondary.settings.42.current', 'custom'),
            options: {
              infura: 'infuraKovan',
              custom: main('connection.secondary.settings.42.options.custom', ''),
              local: 'direct'
            }
          },
          // 74: {
          //   current: main('connection.secondary.settings.74.current', 'idchain'),
          //   options: {
          //     idchain: 'https://idchain.one/api/eth_rpc',
          //     custom: main('connection.secondary.settings.74.options.custom', ''),
          //     local: 'direct'
          //   }
          // },
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

module.exports = () => initial
