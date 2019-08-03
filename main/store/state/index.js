const uuidv5 = require('uuid/v5')

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
  view: { current: '', list: [], data: {}, notify: '', badge: '', addAccount: '' },
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
      views: ['permissions', 'verify', 'control']
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
    launch: main('launch', false),
    reveal: main('reveal', false),
    ledger: {
      derivationPath: main('ledger.derivationPath', 'legacy')
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
        on: main('clients.ipfs.on', false),
        installed: false,
        latest: false,
        version: null,
        state: 'off'
      },
      geth: {
        on: main('clients.geth.on', false),
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
    connection: {
      network: main('connection.network', '1'),
      local: {
        on: main('connection.local.on', false),
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        settings: {
          1: {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          },
          3: {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          },
          4: {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          },
          42: {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          }
        }
      },
      secondary: {
        settings: {
          1: {
            current: main('connection.secondary.settings.1.current', 'infura'),
            options: {
              infura: 'infura',
              custom: main('connection.secondary.settings.1.options.custom', '')
            }
          },
          3: {
            current: main('connection.secondary.settings.3.current', 'infura'),
            options: {
              infura: 'infuraRopsten',
              custom: main('connection.secondary.settings.3.options.custom', '')
            }
          },
          4: {
            current: main('connection.secondary.settings.4.current', 'infura'),
            options: {
              infura: 'infuraRinkeby',
              custom: main('connection.secondary.settings.4.options.custom', '')
            }
          },
          42: {
            current: main('connection.secondary.settings.42.current', 'infura'),
            options: {
              infura: 'infuraKovan',
              custom: main('connection.secondary.settings.42.options.custom', '')
            }
          }
        },
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
Object.keys(initial.main.accounts).forEach(account => {
  account = initial.main.accounts[account]
  if (account) {
    if (account.permissions) delete account.permissions[uuidv5('Unknown', uuidv5.DNS)]
    delete account.signer
  }
})

module.exports = () => initial
