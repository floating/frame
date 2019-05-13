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
  let found = get(path)
  if (found === undefined) return def
  return found
}

let initial = {
  panel: {
    show: false,
    view: 'default'
  },
  view: { current: '', list: [], data: {}, notify: '', badge: '' },
  signers: {},
  tray: {
    open: false,
    initial: true
  },
  balances: {},
  signer: {
    minimized: true,
    open: false,
    current: '',
    view: 'default',
    settings: {
      viewIndex: 0,
      views: ['permissions', 'verify']
    },
    accounts: [],
    showAccounts: false,
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
    accounts: main('accounts', {}), // Persisted account settings and permissions
    _accounts: main('_accounts', {}), // Translate 'accounts' if it exists
    _signers: main('_signers', {}),
    updater: {
      dontRemind: main('updater.dontRemind', [])
    },
    connection: {
      network: main('connection.network', '4'),
      options: ['1', '3', '4', '42'],
      local: {
        on: main('connection.local.on', false),
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        settings: {
          '1': {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          },
          '3': {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          },
          '4': {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          },
          '42': {
            current: 'direct',
            options: {
              direct: 'direct'
            }
          }
        }
      },
      secondary: {
        settings: {
          '1': {
            current: main('connection.secondary.settings.1.current', 'infura'),
            options: {
              infura: 'infura',
              custom: main('connection.secondary.settings.1.options.custom', '')
            }
          },
          '3': {
            current: main('connection.secondary.settings.3.current', 'infura'),
            options: {
              infura: 'infuraRopsten',
              custom: main('connection.secondary.settings.3.options.custom', '')
            }
          },
          '4': {
            current: main('connection.secondary.settings.4.current', 'infura'),
            options: {
              infura: 'infuraRinkeby',
              custom: main('connection.secondary.settings.4.options.custom', '')
            }
          },
          '42': {
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
  if (account && account.permissions) delete account.permissions[uuidv5('Unknown', uuidv5.DNS)]
})

module.exports = () => initial
