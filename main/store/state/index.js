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
    gasPrice: main('gasPrice', {
      1: {
        default: 'normal',
        levels: { safelow: '', normal: '', fast: '', trader: '', custom: '' }
      },
      3: {
        default: 'normal',
        levels: { safelow: '', normal: '', fast: '', trader: '', custom: '' }
      },
      4: {
        default: 'normal',
        levels: { safelow: '', normal: '', fast: '', trader: '', custom: '' }
      },
      42: {
        default: 'normal',
        levels: { safelow: '', normal: '', fast: '', trader: '', custom: '' }
      }
    }),
    connection: {
      network: main('connection.network', '1'),
      local: {
        settings: main('connection.local.settings', {
          1: {
            current: 'infura',
            options: {
              infura: 'infura',
              custom: '',
              local: 'direct'
            }
          },
          3: {
            current: 'infura',
            options: {
              infura: 'infuraRopsten',
              custom: '',
              local: 'direct'
            }
          },
          4: {
            current: 'infura',
            options: {
              infura: 'infuraRinkeby',
              custom: '',
              local: 'direct'
            }
          },
          42: {
            current: 'infura',
            options: {
              infura: 'infuraKovan',
              custom: '',
              local: 'direct'
            }
          }
        }),
        on: main('connection.local.on', true),
        status: 'loading',
        connected: false,
        type: '',
        network: ''
      },
      secondary: {
        settings: main('connection.secondary.settings', {
          1: {
            current: 'custom',
            options: {
              infura: 'infura',
              custom: '',
              local: 'direct'
            }
          },
          3: {
            current: 'custom',
            options: {
              infura: 'infuraRopsten',
              custom: '',
              local: 'direct'
            }
          },
          4: {
            current: 'custom',
            options: {
              infura: 'infuraRinkeby',
              custom: '',
              local: 'direct'
            }
          },
          42: {
            current: 'custom',
            options: {
              infura: 'infuraKovan',
              custom: '',
              local: 'direct'
            }
          }
        }),
        on: main('connection.secondary.on', true),
        status: 'loading',
        connected: false,
        type: '',
        network: ''
      }
    }
  }
}

// Remove permissions granted to unknown origins
Object.keys(initial.main.addresses).forEach(address => {
  address = initial.main.addresses[address]
  if (address && address.permissions) {
    delete address.permissions[uuidv5('Unknown', uuidv5.DNS)]
  }
})

module.exports = () => initial
