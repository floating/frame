const uuidv5 = require('uuid/v5')

const PersistStore = require('electron-store')
const persist = new PersistStore()

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
  view: { current: '', list: [], data: {}, notify: '', updateAvailable: false },
  signers: {},
  tray: {
    open: false
  },
  balances: {},
  signer: {
    minimized: true,
    open: false,
    current: '',
    view: 'default',
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
    accounts: main('accounts', {}), // Persisted account settings and permissions
    connection: {
      network: main('connection.network', '4'),
      options: ['1', '4'],
      status: 'loading',
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
          '4': {
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
            current: main('local.connection.secondary.settings.1.current', 'infura'),
            options: {
              infura: 'infura',
              custom: main('connection.secondary.settings.1.options.custom', '')
            }
          },
          '4': {
            current: main('connection.secondary.settings.4.current', 'infura'),
            options: {
              infura: 'infuraRinkeby',
              custom: main('connection.secondary.settings.4.options.custom', '')
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
